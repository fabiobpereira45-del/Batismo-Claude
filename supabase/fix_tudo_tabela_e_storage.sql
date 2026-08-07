-- ==============================================================================
-- SCRIPT DE CORREÇÃO GERAL: COLUNAS DA TABELA + PERMISSÕES RLS + STORAGE
-- Execute este script no SQL Editor do Supabase para corrigir qualquer erro
-- de colunas ausentes ou bloqueio de permissão (RLS).
-- ==============================================================================

-- 1. ADICIONAR TODAS AS COLUNAS NECESSÁRIAS NA TABELA inscricoes_batismo (caso não existam)
ALTER TABLE inscricoes_batismo
ADD COLUMN IF NOT EXISTS cargo TEXT,
ADD COLUMN IF NOT EXISTS funcao TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS rua TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS estado_civil TEXT,
ADD COLUMN IF NOT EXISTS nome_conjuge TEXT,
ADD COLUMN IF NOT EXISTS nome_pai TEXT,
ADD COLUMN IF NOT EXISTS nome_mae TEXT,
ADD COLUMN IF NOT EXISTS naturalidade TEXT,
ADD COLUMN IF NOT EXISTS rg TEXT,
ADD COLUMN IF NOT EXISTS data_batismo DATE,
ADD COLUMN IF NOT EXISTS data_consagracao DATE,
ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2. GARANTIR PERMISSÕES RLS NA TABELA DE INSCRIÇÕES
ALTER TABLE inscricoes_batismo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserir publica" ON inscricoes_batismo;
CREATE POLICY "Permitir inserir publica" ON inscricoes_batismo
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir selecao publica" ON inscricoes_batismo;
CREATE POLICY "Permitir selecao publica" ON inscricoes_batismo
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir atualizacao publica" ON inscricoes_batismo;
CREATE POLICY "Permitir atualizacao publica" ON inscricoes_batismo
FOR UPDATE TO public USING (true) WITH CHECK (true);

-- 3. REMOVER E RECRIAR POLÍTICAS RLS DO STORAGE (FOTOS)
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
