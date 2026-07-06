# App Integration & Edge Functions (Self-Hosted)

## Overview
A infraestrutura (Fase 1-3) foi concluída no VPS `100.114.251.99`. No entanto, a aplicação frontend/backend local (`gerentesmec`) ainda se conecta à nuvem legada e possui 18 Edge Functions que precisam ser instanciadas no contêiner Self-Hosted.

## Scope & Boundaries
- **Environment Flip**: Atualização agressiva do arquivo `.env` substituindo chaves legadas (`ijomsruro...`) pelas chaves JWT e Host recém gerados no nosso script da VPS.
- **Edge Deploy**: Transbordo de 18 Edge Functions (`ai-auditor`, `chatwoot-sync`, etc.) da pasta `supabase/functions/` local diretamente para o cluster Edge Function Deno rodando via docker compose no VPS, injetando as variáveis globais (`OPENAI_API_KEY`, tokens n8n) em cada função.

## Constraints
- Supabase Self-Hosted usa containers isolados. Edge functions nativas podem exigir configuração de variáveis de ambiente do próprio serviço de Deno.
- Precisaremos usar a CLI do Supabase localmente conectada ao novo endpoint host para emitir os deploys, ou sincronizar os volumes via SSH diretamente se a CLI rejeitar hosts sem SSL completo na config padrão.
