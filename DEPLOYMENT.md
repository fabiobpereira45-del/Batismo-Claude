# 🚀 Guia de Deploy - Inscrição Batismo

Este documento fornece instruções passo a passo para fazer deploy da aplicação Inscrição Batismo no Supabase e Vercel.

## 📋 Pré-requisitos

- Node.js 18 ou superior instalado
- Conta gratuita no Supabase (https://supabase.com)
- Conta gratuita no Vercel (https://vercel.com)
- Git instalado
- Repositório GitHub criado

## 🗄️ Passo 1: Configurar Banco de Dados Supabase

### 1.1 Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"New Project"**
3. Preencha os dados:
   - **Organization**: Selecione ou crie uma
   - **Project Name**: `inscricao-batismo`
   - **Password**: Defina uma senha segura e salve em local seguro
   - **Region**: Escolha a região mais próxima (ex: South America - São Paulo)
4. Clique em **"Create new project"**
5. Aguarde 2-3 minutos enquanto o projeto é criado

### 1.2 Criar a Tabela de Inscrições

1. No painel Supabase, vá para **"SQL Editor"**
2. Clique em **"New query"**
3. Cole o seguinte SQL:

```sql
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
```

4. Clique em **"Run"** (ou Ctrl+Enter)
5. Verifique se a tabela foi criada em **"Table Editor"** (deve aparecer `inscricoes_batismo`)

### 1.3 Obter Credenciais do Supabase

1. No painel Supabase, clique em **"Project Settings"** (ícone de engrenagem)
2. Vá para a aba **"API"**
3. Em **"Project API keys"**, você encontrará:
   - **Project URL**: Algo como `https://lhayikqeysjswwywyxfjuc.supabase.co`
   - **anon public**: Copie a chave (começa com `eyJhbGc...`)
4. Salve essas informações - você usará no próximo passo

## 🔧 Passo 2: Configurar Variáveis de Ambiente Localmente

1. Abra o terminal na raiz do projeto
2. Crie um arquivo `.env.local`:

```bash
copy .env.example .env.local
```

3. Edite o arquivo `.env.local` e adicione suas credenciais do Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

## 🧪 Passo 3: Testar Localmente

1. Instale as dependências:

```bash
npm install
```

2. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

3. Abra [http://localhost:3000](http://localhost:3000) no seu navegador
4. Teste o formulário - tente enviar uma inscrição
5. Verifique se os dados aparecem no **Supabase** → **"Table Editor"** → `inscricoes_batismo`

## 🌐 Passo 4: Deploy na Vercel

### 4.1 Preparar Repositório Git

Se ainda não fez:

```bash
git init
git add .
git commit -m "Initial commit: Inscricao Batismo app"
git branch -M main
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git push -u origin main
```

### 4.2 Fazer Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login/cadastro
2. Clique em **"Add New"** → **"Project"**
3. Selecione **"Import Git Repository"**
4. Cole a URL do seu repositório GitHub: `https://github.com/seu-usuario/seu-repositorio.git`
5. Clique em **"Import"**
6. Configure as **"Environment Variables"**:
   - Adicione:
     - `NEXT_PUBLIC_SUPABASE_URL` = `https://seu-projeto-ref.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua chave anon
7. Clique em **"Deploy"**
8. Aguarde o deploy terminar (2-3 minutos)
9. Sua aplicação estará disponível em uma URL fornecida pela Vercel

## ✅ Checklist Final

- [ ] Projeto criado no Supabase
- [ ] Tabela `inscricoes_batismo` criada
- [ ] Credenciais do Supabase obtidas
- [ ] Arquivo `.env.local` configurado
- [ ] Teste local funcionando
- [ ] Repositório GitHub criado e código enviado
- [ ] Deploy no Vercel realizado
- [ ] URL da aplicação funciona

## 🆘 Troubleshooting

### "Could not connect to Supabase"
- Verifique se a URL do Supabase está correta em `.env.local`
- Confirme que a chave anon foi copiada completamente
- Teste no Supabase se há dados na tabela

### "Erro de validação do formulário"
- Verifique se a biblioteca Zod está instalada: `npm install zod`
- Limpe o cache: `npm cache clean --force`

### "Deploy Vercel falhou"
- Verifique se todos os arquivos foram enviados para GitHub: `git status`
- Confirme que as Environment Variables estão configuradas na Vercel
- Verifique os logs do deploy na dashboard da Vercel

## 📚 Recursos Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Tailwind CSS](https://tailwindcss.com/docs)

---

**Última atualização**: Maio de 2026
