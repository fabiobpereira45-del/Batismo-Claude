# ⚡ Quick Start - Inscrição Batismo

## Início Rápido em 5 Minutos

### 1️⃣ Clonar Repositório

```bash
git clone https://github.com/fabiobpereira45-del/Batismo.git
cd Batismo
npm install
```

### 2️⃣ Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local` e adicione suas credenciais do Supabase:

```bash
# Windows
copy .env.example .env.local

# macOS/Linux
cp .env.example .env.local
```

Edite o arquivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 3️⃣ Executar Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

### 4️⃣ Testar no Supabase

1. Preencha o formulário
2. Clique em "Enviar"
3. Acesse [supabase.com](https://supabase.com) → seu projeto → "Table Editor"
4. Verifique se os dados aparecem na tabela `inscricoes_batismo`

---

## Não Tem Supabase Ainda?

1. Acesse https://supabase.com
2. Clique em "New Project"
3. Preencha com os dados (senha segura!)
4. Vá em "SQL Editor" → "New query"
5. Cole o conteúdo de `supabase/schema.sql`
6. Clique em "Run"
7. Copie as credenciais de "Project Settings" → "API"

## Deploy (Opcional)

Para fazer deploy na Vercel, veja [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Pronto! Sua aplicação está rodando!** 🎉
