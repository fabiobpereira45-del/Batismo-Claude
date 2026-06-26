-- Execute este comando no SQL Editor do seu projeto Supabase para adicionar as novas colunas

ALTER TABLE inscricoes_batismo
ADD COLUMN cargo TEXT,
ADD COLUMN funcao TEXT,
ADD COLUMN cep TEXT,
ADD COLUMN rua TEXT,
ADD COLUMN numero TEXT,
ADD COLUMN bairro TEXT,
ADD COLUMN cidade TEXT,
ADD COLUMN estado TEXT,
ADD COLUMN estado_civil TEXT;
