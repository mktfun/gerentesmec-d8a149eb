# Design: API e Agente de Histórico

## 1. Abordagem de Interface e Backend

Nenhuma interface UI no front-end precisa ser alterada, pois as pontuações injetadas no banco aparecerão automaticamente no Dashboard de Líderes como fizemos na Task 006.

O Backend será desenhado sob a forma de um **Script CLI do Agente (Node.js)** que consome os serviços existentes (Supabase Data API e Chatwoot API), garantindo que as mídias possam ser devidamente avaliadas via **Google Gen AI SDK (File API)**.

A decisão de criar um **Script Local de Agente** ao invés de uma **Edge Function Serverless** se dá pelo fato de processamento de vídeos requerer:
1. Tempo alto de execução (o timeout de Edge Function é agressivo).
2. Armazenamento temporário em disco para subir o arquivo para o Gemini (algo que o Deno Edge Network impõe limites severos).

## 2. Estrutura de Código

Vamos criar na raiz do projeto (ou no `.agents/scripts`) o arquivo `ai-bulk-auditor.mjs`.

O script irá:
1. Buscar leads pela API do Supabase localmente no terminal.
2. Extrair o `chatwoot_conversation_id` dos leads.
3. Chamar a API do Chatwoot (GET `/api/v1/accounts/1/conversations/{id}/messages`).
4. Identificar arquivos `audio/*`, `video/*` e `image/*`. Fazer o download local.
5. Injetar na File API do Gemini (usando a SDK).
6. Construir um grande array textual `[{"role": "user", "parts": [...]}]` onde anexos reais são passados como `fileData: { fileUri }`.
7. Submeter ao Gemini 1.5 Pro com o System Prompt rigoroso (com CoT) extraído da Task 006.
8. Executar um `update` no Supabase com os dados recalculados e inserir anotações nas `chat_messages`.

## 3. Segurança e Acesso
- O Agente rodará autenticado usando o `SUPABASE_SERVICE_ROLE_KEY` e a `GEMINI_API_KEY`.
- Ele rodará dentro do computador local ou do provedor de infraestrutura (Antigravity), limpando os arquivos em disco após auditar cada lead (`fs.unlinkSync()`).
