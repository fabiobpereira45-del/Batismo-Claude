-- Schema SQL atualizado para Supabase
-- Execute este comando no SQL Editor do Supabase

-- Criar tabela de administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir admin padrão (senha: admin123)
-- Nota: Em produção, use bcrypt ou similar para hash de senha
INSERT INTO admin_users (email, password_hash) 
VALUES ('admin@batismo.com', crypt('admin123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

-- Atualizar políticas RLS para permitir todas operações para autenticados
DROP POLICY IF EXISTS "Permitir inserir" ON inscricoes_batismo;
DROP POLICY IF EXISTS "Permitir selecionar autenticado" ON inscricoes_batismo;

CREATE POLICY "Permitir todas operações para autenticados" ON inscricoes_batismo
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Garantir que a tabela de inscrições existe com a estrutura correta
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

-- Recriar índice se não existir
CREATE INDEX IF NOT EXISTS idx_inscricoes_batismo_cpf ON inscricoes_batismo(cpf);
CREATE INDEX IF NOT EXISTS idx_inscricoes_batismo_igreja ON inscricoes_batismo(igreja);
CREATE INDEX IF NOT EXISTS idx_inscricoes_batismo_pastor ON inscricoes_batismo(pastor);
CREATE INDEX IF NOT EXISTS idx_inscricoes_batismo_data_batismo ON inscricoes_batismo(data_batismo);
