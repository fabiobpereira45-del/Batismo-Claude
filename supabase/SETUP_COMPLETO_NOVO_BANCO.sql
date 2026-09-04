-- ==============================================================================
-- SETUP COMPLETO PARA O NOVO PROJETO SUPABASE
-- Execute este script completo no SQL Editor do seu novo projeto Supabase:
-- https://supabase.com/dashboard/project/vppembhvrlqountgdigj/sql/new
-- ==============================================================================

-- 0. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. TABELA PRINCIPAL DE INSCRIÇÕES / MEMBROS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inscricoes_batismo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  data_nascimento DATE NOT NULL,
  data_consagracao DATE,
  telefone TEXT NOT NULL,
  igreja TEXT NOT NULL,
  pastor TEXT NOT NULL,

  cargo TEXT,
  funcao TEXT,
  cep TEXT,
  rua TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  estado_civil TEXT,
  nome_conjuge TEXT,

  nome_pai TEXT,
  nome_mae TEXT,
  naturalidade TEXT,
  rg TEXT,
  data_batismo DATE,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_inscricoes_batismo_cpf ON public.inscricoes_batismo(cpf);
CREATE INDEX IF NOT EXISTS idx_inscricoes_batismo_igreja ON public.inscricoes_batismo(igreja);

-- RLS na tabela inscricoes_batismo
ALTER TABLE public.inscricoes_batismo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserir publica" ON public.inscricoes_batismo;
CREATE POLICY "Permitir inserir publica" ON public.inscricoes_batismo
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir selecao publica" ON public.inscricoes_batismo;
CREATE POLICY "Permitir selecao publica" ON public.inscricoes_batismo
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir atualizacao publica" ON public.inscricoes_batismo;
CREATE POLICY "Permitir atualizacao publica" ON public.inscricoes_batismo
  FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delecao autenticado" ON public.inscricoes_batismo;
CREATE POLICY "Permitir delecao autenticado" ON public.inscricoes_batismo
  FOR DELETE TO authenticated USING (true);

-- ------------------------------------------------------------------------------
-- 2. BUCKET DE STORAGE PARA FOTOS (fotos-membros)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-membros', 'fotos-membros', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas RLS do Storage
DROP POLICY IF EXISTS "Fotos Membros Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Membros Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Membros Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Membros Public Delete" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload publico de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura publica de fotos" ON storage.objects;

CREATE POLICY "Fotos Membros Public Insert"
  ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'fotos-membros');

CREATE POLICY "Fotos Membros Public Select"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'fotos-membros');

CREATE POLICY "Fotos Membros Public Update"
  ON storage.objects FOR UPDATE TO public
  USING (bucket_id = 'fotos-membros') WITH CHECK (bucket_id = 'fotos-membros');

CREATE POLICY "Fotos Membros Public Delete"
  ON storage.objects FOR DELETE TO public
  USING (bucket_id = 'fotos-membros');

-- ------------------------------------------------------------------------------
-- 3. GERENCIAMENTO DE USUÁRIOS E PERMISSÕES (ADMIN / MASTER)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfil_usuarios (
  id uuid references auth.users not null primary key,
  email text not null,
  status text not null default 'pendente', -- 'pendente', 'aprovado' ou 'bloqueado'
  role text not null default 'padrao',     -- 'padrao' ou 'master'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.perfil_usuarios ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para checar role master sem recursão RLS
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfil_usuarios 
    WHERE id = auth.uid() AND role = 'master'
  );
$$;

-- RLS de perfil_usuarios
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.perfil_usuarios;
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.perfil_usuarios
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Masters podem ver todos os perfis" ON public.perfil_usuarios;
CREATE POLICY "Masters podem ver todos os perfis" ON public.perfil_usuarios
  FOR SELECT USING (public.is_master());

DROP POLICY IF EXISTS "Masters podem atualizar perfis" ON public.perfil_usuarios;
CREATE POLICY "Masters podem atualizar perfis" ON public.perfil_usuarios
  FOR UPDATE USING (public.is_master());

DROP POLICY IF EXISTS "Masters podem deletar perfis" ON public.perfil_usuarios;
CREATE POLICY "Masters podem deletar perfis" ON public.perfil_usuarios
  FOR DELETE USING (public.is_master());

-- Trigger para criar perfil automaticamente quando um usuário se cadastra
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
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Se já existirem usuários no Auth, torná-los masters aprovados
INSERT INTO public.perfil_usuarios (id, email, status, role)
SELECT id, email, 'aprovado', 'master'
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET status = 'aprovado', role = 'master';

-- ------------------------------------------------------------------------------
-- 4. FUNÇÃO RPC PARA MASTER ALTERAR SENHA DE USUÁRIOS
-- ------------------------------------------------------------------------------
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
