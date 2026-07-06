# Architecture Design: App & Edge Integrations

## Workflow do Deploy Edge (Self-Hosted)
A forma mais resiliente de injetar 18 Edge Functions dentro de um container Docker Edge (Deno) orquestrado na VPS é:
1. Compactar o diretório `./supabase/functions/` localmente.
2. Transferir (SFTP/SSH) para a VPS em `/home/servidor/supabase_deploy/supabase/volumes/functions`.
3. Extrair as pastas e garantir permissões corretas pro usuário do Docker ler (`chmod/chown`).
4. Restartar o contêiner Deno (`docker restart supabase-edge-functions`) para disparar o Hot-Reloading/Sync do volume.

## Variables Translation (App .env)
Precisamos buscar as chaves geradas dinamicamente na VPS (`/home/servidor/supabase_deploy/supabase/docker/.env`) e sobrescrever o `.env` do App:
- Ler `ANON_KEY` lá da VPS -> Sobrescreve `VITE_SUPABASE_ANON_KEY` local.
- Ler `SERVICE_ROLE_KEY` da VPS -> Sobrescreve `VITE_SUPABASE_SERVICE_ROLE_KEY` local.
- `API_EXTERNAL_URL` -> Sobrescreve `VITE_SUPABASE_URL` local (que passa a ser `http://100.114.251.99:8000`).

## Edge Variables
Se as functions requerem tokens extras, eles devem ser mapeados no `docker-compose.yml` local do container `supabase-edge-functions` (sessão `environment`), para que o Deno acesse coisas como `OPENAI_API_KEY`.
