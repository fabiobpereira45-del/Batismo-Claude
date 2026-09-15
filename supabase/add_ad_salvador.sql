-- ==============================================================================
-- MIGRAÇÃO: Adicionar controle de cadastro na plataforma AD Salvador
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==============================================================================

-- 1. Adicionar coluna de controle AD Salvador
ALTER TABLE public.inscricoes_batismo
  ADD COLUMN IF NOT EXISTS cadastrado_ad_salvador BOOLEAN DEFAULT FALSE;

-- 2. Índice para buscas/filtros por status AD Salvador
CREATE INDEX IF NOT EXISTS idx_inscricoes_ad_salvador
  ON public.inscricoes_batismo(cadastrado_ad_salvador);

-- 3. Confirmar alteração
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE cadastrado_ad_salvador = true) AS cadastrados_ad_salvador
FROM public.inscricoes_batismo;
