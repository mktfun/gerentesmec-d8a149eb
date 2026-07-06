# Execution Plan: App & Edge Integrations

- [x] **Fase 1: Configuração do Cliente (Front/Back Local)**
  - [x] Ler `.env` da VPS via conexão SSH.
  - [x] Extrair chaves recém-criadas (`ANON_KEY`, `SERVICE_ROLE_KEY`).
  - [x] Substituir `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` do App local.

- [x] **Fase 2: Deploy de Edge Functions (Self-Hosted Sync)**
  - [x] Zippar/Agrupar as 18 functions dentro de `supabase/functions/`.
  - [x] Transmitir para o host VPS (via upload script).
  - [x] Extrair diretamente em `/home/servidor/supabase_deploy/supabase/volumes/functions`.
  - [x] Renomear os diretórios para corresponder à assinatura do Deno (Pulado: o Deno lê a estrutura custom default do volume).
  - [x] Reiniciar o container `supabase-edge-functions`.

- [ ] **Fase 3: Variáveis e Ambientes da Nuvem**
  - [ ] Pedir as Secrets ao Usuário (OpenAI, Chatwoot, EvolutionAPI) para mapear no arquivo docker env da VPS (para as Edge Functions não quebrarem).
