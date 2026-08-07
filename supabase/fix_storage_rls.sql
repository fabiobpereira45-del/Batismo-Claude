-- ==============================================================================
-- SCRIPT DE CORREÇÃO: POLÍTICAS RLS NO SUPABASE STORAGE (SEM ALTER TABLE)
-- Execute este script no SQL Editor do Supabase
-- ==============================================================================

-- 1. Remover políticas antigas para evitar conflitos/duplicidades
DROP POLICY IF EXISTS "Fotos Membros Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Membros Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Membros Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Fotos Membros Public Delete" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload publico de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura publica de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualizacao publica de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir deletar fotos publicamente" ON storage.objects;

-- 2. Criar Política RLS para Upload de Fotos (INSERT)
CREATE POLICY "Fotos Membros Public Insert"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'fotos-membros');

-- 3. Criar Política RLS para Leitura de Fotos (SELECT)
CREATE POLICY "Fotos Membros Public Select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'fotos-membros');

-- 4. Criar Política RLS para Atualização de Fotos (UPDATE - Upsert)
CREATE POLICY "Fotos Membros Public Update"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'fotos-membros')
WITH CHECK (bucket_id = 'fotos-membros');

-- 5. Criar Política RLS para Deleção de Fotos (DELETE)
CREATE POLICY "Fotos Membros Public Delete"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'fotos-membros');


-- ==============================================================================
-- GARANTIR PERMISSÕES RLS NA TABELA DE INSCRIÇÕES (inscricoes_batismo)
-- ==============================================================================

ALTER TABLE inscricoes_batismo ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT para todos os usuários (formulário público)
DROP POLICY IF EXISTS "Permitir inserir publica" ON inscricoes_batismo;
CREATE POLICY "Permitir inserir publica" ON inscricoes_batismo
FOR INSERT TO public WITH CHECK (true);

-- Permitir SELECT para todos os usuários
DROP POLICY IF EXISTS "Permitir selecao publica" ON inscricoes_batismo;
CREATE POLICY "Permitir selecao publica" ON inscricoes_batismo
FOR SELECT TO public USING (true);

-- Permitir UPDATE para todos os usuários
DROP POLICY IF EXISTS "Permitir atualizacao publica" ON inscricoes_batismo;
CREATE POLICY "Permitir atualizacao publica" ON inscricoes_batismo
FOR UPDATE TO public USING (true) WITH CHECK (true);
