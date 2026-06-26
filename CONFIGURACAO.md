# Configuração de Login Master e Relatórios PDF

## Configuração do Usuário Master

### Passo 1: Criar usuário master no Supabase

1. Acesse o painel do Supabase
2. Vá para **Authentication > Users**
3. Crie um novo usuário com:
   - Email: `master@batismo.com` (ou outro email desejado)
   - Password: (senha segura)
4. Após criar, vá para **User > User metadata** e adicione:
   ```json
   { "role": "master" }
   ```

### Passo 2: Atualizar políticas RLS (se necessário)

O schema já está configurado para permitir SELECT para usuários autenticados.

### Passo 3: Configurar variáveis de ambiente

Adicione no arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=seu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_key_anon
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
```

## Funcionalidades Implementadas

### 1. Login Master
- Página: `/admin/login-master`
- Acesso restrito a usuários com role `master`
- Redireciona para `/admin/dashboard` após login

### 2. Download de Relatório PDF
- Disponível no dashboard e na página de inscrições
- Gera PDF com todos os registros ou apenas os filtrados
- Inclui filtros por nome, igreja e pastor

## Uso

1. Acesse `/admin/login-master`
2. Faça login com as credenciais master
3. No dashboard, você pode:
   - Visualizar estatísticas
   - Filtrar inscrições
   - Baixar relatório em PDF
   - Ver todas as inscrições