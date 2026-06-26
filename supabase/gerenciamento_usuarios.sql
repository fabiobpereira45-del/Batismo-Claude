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
