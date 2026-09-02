-- 1. Criar a tabela de perfis de usuário
CREATE TABLE public.perfil_usuarios (
  id uuid references auth.users not null primary key,
  email text not null,
  status text not null default 'pendente', -- 'pendente', 'aprovado' ou 'bloqueado'
  role text not null default 'padrao',     -- 'padrao' ou 'master'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.perfil_usuarios ENABLE ROW LEVEL SECURITY;

-- 2. Função segura para verificar se o usuário atual é master (evita recursão infinita no RLS)
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfil_usuarios 
    WHERE id = auth.uid() AND role = 'master'
  );
$$;

-- 3. Políticas de Segurança (RLS)
-- O usuário pode ver o seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.perfil_usuarios
  FOR SELECT USING (auth.uid() = id);

-- Masters podem ver todos os perfis
CREATE POLICY "Masters podem ver todos os perfis" ON public.perfil_usuarios
  FOR SELECT USING (public.is_master());

-- Masters podem atualizar perfis (Aprovar, Bloquear, Promover)
CREATE POLICY "Masters podem atualizar perfis" ON public.perfil_usuarios
  FOR UPDATE USING (public.is_master());

-- Masters podem deletar perfis
CREATE POLICY "Masters podem deletar perfis" ON public.perfil_usuarios
  FOR DELETE USING (public.is_master());

-- 4. Gatilho (Trigger) para criar automaticamente o perfil_usuario sempre que alguém se cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfil_usuarios (id, email, status, role)
  VALUES (
    new.id,
    new.email,
    'pendente',
    'padrao'
  );
  RETURN new;
END;
$$;

-- Atachar o gatilho à tabela auth.users (do próprio Supabase)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Sincronizar usuários que já existiam antes de criarmos esta tabela
-- Vamos transformar todos os que você já criou em "Master" e já "aprovados", 
-- para você não perder o acesso ao seu próprio painel.
INSERT INTO public.perfil_usuarios (id, email, status, role)
SELECT id, email, 'aprovado', 'master'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 6. Função para permitir que usuários Master alterem a senha de qualquer usuário
CREATE OR REPLACE FUNCTION public.alterar_senha_usuario(usuario_id uuid, nova_senha text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_is_master BOOLEAN;
BEGIN
  -- Verifica se quem está logado possui a role 'master'
  SELECT EXISTS (
    SELECT 1 FROM public.perfil_usuarios 
    WHERE id = auth.uid() AND role = 'master'
  ) INTO v_is_master;

  IF NOT v_is_master THEN
    RAISE EXCEPTION 'Acesso negado: Apenas usuários Master podem alterar senhas.';
  END IF;

  -- Valida tamanho mínimo da nova senha
  IF length(nova_senha) < 6 THEN
    RAISE EXCEPTION 'A nova senha deve ter no mínimo 6 caracteres.';
  END IF;

  -- Atualiza o hash da senha diretamente na tabela auth.users
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(nova_senha, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = usuario_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  RETURN json_build_object('success', true, 'message', 'Senha alterada com sucesso.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.alterar_senha_usuario(uuid, text) TO authenticated;

