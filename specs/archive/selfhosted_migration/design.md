# Architecture Design: Supabase Migration (Self-Hosted)

## System Flow & Data Sync Strategy
A migração deve ser orquestrada em 4 eixos separados, que podem ser roteirizados num Makefile ou bash script unificado.

### 1. Database Migrator (`db-sync`)
- Utiliza `pg_dump` extraindo dados do pooler Supabase original.
- **Comando:** `pg_dump "$REMOTE_DB_URL" -F c --schema=public --schema=auth --schema=storage -f backup.dump`
- **Restore:** `pg_restore -d "$LOCAL_DB_URL" backup.dump`

### 2. Storage Sync (`storage-sync`)
- Implantação de um script `rclone` local.
- **Target:** Mapeia o S3-compatible bucket da nuvem (`$AWS_ACCESS_KEY_ID`, `$AWS_SECRET_ACCESS_KEY` do projeto Cloud).
- **Destino:** Diretório de volumes do Storage do Docker Compose.

### 3. Edge Functions Exporter
- Cópia do código-fonte do monorepo atual (`supabase/functions/*`).
- Criação de um shell script (`deploy_functions.sh`) que itera sobre as pastas locais e utiliza a CLI local do docker ou `supabase functions deploy` apontando pro self-hosted.

### 4. Auth & Config Migrator
- Tarefa manual/scriptada para reconstruir Auth Providers (Google, Apple, etc.) e SMTP de e-mail no container `.env` do self-hosted (Variáveis de configuração do GoTrue).

## Infrastructure (VPS + Docker)
- Clonar o repositório oficial do supabase: `git clone https://github.com/supabase/supabase`
- Configuração do `.env` na VPS alterando a `API_EXTERNAL_URL` e gerando as senhas de banco seguras e JWT Secrets nativos usando a CLI.
- Utilização de `Nginx Proxy Manager` ou `Caddy` para gerenciar os certificados SSL gerados automaticamente e reverter proxy para porta `8000` (API/Studio).

## Test Cases (SCAN -> INFER -> VERIFY)
1. **Schema Validation:** Garantir que o auth tem os mesmos usuários e a tabela `public.leads` bate o `COUNT()`.
2. **Storage Resolution:** Tentar abrir a URL de um arquivo armazenado no dashboard do self-hosted para verificar linkagem de metadados + binários.
3. **Trigger Validation:** Testar se as inserções geram as real-time subscriptions no cliente conectado à nova URL.
