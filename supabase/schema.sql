-- Schema SQL para Supabase
-- Execute este comando no SQL Editor do Supabase

-- Criar tabela de inscrições para batismo
CREATE TABLE IF NOT EXISTS inscricoes_batismo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  data_nascimento DATE NOT NULL,
  telefone TEXT NOT NULL,
  igreja TEXT NOT NULL,
  pastor TEXT NOT NULL,
  data_batismo DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE inscricoes_batismo ENABLE ROW LEVEL SECURITY;

-- Policy para permitir INSERT pública (sem autenticação)
CREATE POLICY "Permitir inserir" ON inscricoes_batismo
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy para permitir SELECT apenas para authenticated (para/admin)
CREATE POLICY "Permitir selecionar autenticado" ON inscricoes_batismo
  FOR SELECT
  TO authenticated
  USING (true);

-- Criar índice no CPF para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_inscricoes_batismo_cpf ON inscricoes_batismo(cpf);