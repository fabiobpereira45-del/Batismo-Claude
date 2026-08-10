-- ==============================================================================
-- SCRIPT DE MIGRAÇÃO DE CONGREGAÇÕES - AD SETOR TANCREDO NEVES
-- ==============================================================================
-- Este script realiza a migração dos membros cadastrados nas congregações:
-- 1. "Final de Linha" -> Migra para "ADMTN - RUA PARAÍBA"
-- 2. "Templo Central" -> Migra para "ADMTN - TEMPLO SEDE SETORIAL"
-- ==============================================================================

-- 1. Migrar todos os membros do Final de Linha para ADMTN - RUA PARAÍBA
UPDATE inscricoes_batismo
SET igreja = 'ADMTN - RUA PARAÍBA'
WHERE igreja ILIKE '%final de linha%'
   OR igreja ILIKE '%final da linha%'
   OR igreja ILIKE '%fim de linha%';

-- 2. Migrar todos os membros do Templo Central para ADMTN - TEMPLO SEDE SETORIAL
UPDATE inscricoes_batismo
SET igreja = 'ADMTN - TEMPLO SEDE SETORIAL'
WHERE igreja ILIKE '%templo central%'
   OR igreja ILIKE '%central%';

-- 3. Normalizar grafias sem o prefixo ADMTN se existirem
UPDATE inscricoes_batismo
SET igreja = 'ADMTN - RUA PARAÍBA'
WHERE igreja = 'RUA PARAÍBA' 
   OR igreja = 'Rua Paraíba';

UPDATE inscricoes_batismo
SET igreja = 'ADMTN - TEMPLO SEDE SETORIAL'
WHERE igreja = 'SEDE SETORIAL' 
   OR igreja = 'Sede Setorial' 
   OR igreja = 'TEMPLO SEDE SETORIAL';

-- 4. Consulta para confirmar a migração dos dados
SELECT igreja, COUNT(*) AS total_membros
FROM inscricoes_batismo
GROUP BY igreja
ORDER BY total_membros DESC;
