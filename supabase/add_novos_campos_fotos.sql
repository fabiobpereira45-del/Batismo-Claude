-- Execute este comando no SQL Editor do seu projeto Supabase para adicionar as novas colunas
-- Acesse: https://supabase.com -> seu projeto -> SQL Editor -> New Query, cole este comando e clique em "Run"

ALTER TABLE inscricoes_batismo
ADD COLUMN IF NOT EXISTS nome_pai TEXT,
ADD COLUMN IF NOT EXISTS nome_mae TEXT,
ADD COLUMN IF NOT EXISTS naturalidade TEXT,
ADD COLUMN IF NOT EXISTS rg TEXT,
ADD COLUMN IF NOT EXISTS data_batismo DATE,
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS nome_conjuge TEXT;

