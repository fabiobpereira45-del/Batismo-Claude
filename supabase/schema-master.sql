-- Schema para usuários master
-- Execute este comando no SQL Editor do Supabase

-- Criar tabela de usuários master
CREATE TABLE IF NOT EXISTS usuarios_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ativo BOOLEAN DEFAULT true
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE usuarios_master ENABLE ROW LEVEL SECURITY;

-- Policy para permitir apenas operações específicas
CREATE POLICY "Permitir acesso autenticado" ON usuarios_master
  FOR ALL
  TO authenticated
  USING (true);

-- Criar índice no email para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_usuarios_master_email ON usuarios_master(email);