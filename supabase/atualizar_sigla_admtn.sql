-- ==============================================================================
-- SCRIPT DE MIGRAÇÃO: Atualizar a antiga sigla 'ADMTN' para 'AD Setor T. Neves'
-- Execute no SQL Editor do Supabase se desejar atualizar as linhas existentes no banco:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==============================================================================

-- 1. Atualizar todas as congregações que iniciam com 'ADMTN - '
UPDATE public.inscricoes_batismo
SET igreja = REPLACE(igreja, 'ADMTN - ', 'AD Setor T. Neves - ')
WHERE igreja LIKE 'ADMTN - %';

-- 2. Atualizar se houver registro apenas com 'ADMTN'
UPDATE public.inscricoes_batismo
SET igreja = 'Assembléia de Deus Setor Tancredo Neves'
WHERE TRIM(igreja) = 'ADMTN';

-- 3. Confirmar a quantidade de congregações atualizadas
SELECT igreja, COUNT(*) AS total_membros
FROM public.inscricoes_batismo
GROUP BY igreja
ORDER BY igreja;
