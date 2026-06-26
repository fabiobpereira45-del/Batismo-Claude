# Formulário de Inscrição para Batismo

Aplicação web para captação de dados de inscrições para batismo na Igreja Assembléa de Deus Ministério Tancredo Neves.

## Tecnologias

- **Frontend**: Next.js 14 + TypeScript
- **Estilização**: Tailwind CSS
- **Banco de Dados**: Supabase (PostgreSQL)
- **Hospedagem**: Vercel

## Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuíto)
- Conta no GitHub (para Vercel)

---

## Configuração do Supabase

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em "New project"
3. Preencha os dados:
   - **Name**: `inscricao-batismo`
   - **Database Password**: Defina uma senha segura
   - **Region**: Escolha a região mais próxima
4. Clique em "Create new project"
5. Aguarde a criação (pode levar alguns minutos)

### 2. Criar tabela

1. No painel do Supabase, vá em **SQL Editor**
2. Copie o conteúdo do arquivo `supabase/schema.sql`
3. Cole no editor e clique em **Run**
4. Verifique se a tabela foi criada em **Table Editor**

### 3. Obter credenciais

1. Vá em **Project Settings** (ícone de engrenagem)
2. Clique em **API**
3. Em **Project API keys**, copie:
   - `Project URL` → URL do projeto
   - `anon public` → Chave anônima

---

## Configuração Local

### 1. Instalar dependências

```bash
cd inscricao-batismo
npm install
```

### 2. Configurar variáveis de ambiente

```bash
# Copie o arquivo de exemplo
copy .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### 3. Executar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## Deploy na Vercel

### 1. Preparar código

Crie um repositório no GitHub e faça upload do código:

```bash
# No diretório do projeto
git init
git add .
git commit -m "Initial commit"
```

Crie o repositório no GitHub e faça push:

```bash
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git push -u origin main
```

### 2. Deploy

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "Add New..." → "Project"
3. Importe seu repositório do GitHub
4. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua chave anon
5. Clique em **Deploy**

Aguarde o deploy terminar e pronto! Seu formulário estará no ar.

---

## Estrutura de Arquivos

```
inscricao-batismo/
├── app/
│   ├── globals.css      # Estilos globais
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Página principal
├── components/
│   ├── formulario-batismo.tsx  # Formulário principal
│   └── ui/
│       ├── button.tsx       # Componente de botão
│       ├── card.tsx         # Componente de cartão
│       └── input.tsx        # Componente de entrada
├── lib/
│   ├── supabase.ts     # Cliente Supabase
│   └── utils.ts       # Funções utilitárias
├── supabase/
│   └── schema.sql     # Schema do banco de dados
├── .env.example      # Exemplo de variáveis
├── next.config.js   # Configuração Next.js
├── package.json    # Dependências
├── postcss.config.js # Configuração PostCSS
├── tailwind.config.ts # Configuração Tailwind
└── tsconfig.json   # Configuração TypeScript
```

---

## Campos do Formulário

| Campo | Tipo | Validação |
|-------|------|-----------|
| Nome | texto | Obrigatório, mínimo 3 caracteres |
| CPF | texto | Obrigatório, CPF válido |
| Data de nascimento | data | Obrigatório, data passada |
| Telefone | texto | Obrigatório, formato (00) 00000-0000 |
| Igreja | texto | Obrigatório |
| Pastor | texto | Obrigatório |
| Data do batismo | data | Obrigatória, hoje ou futura |

---

## Suporte

Em caso de dúvidas ou problemas,abra uma issue no repositório.