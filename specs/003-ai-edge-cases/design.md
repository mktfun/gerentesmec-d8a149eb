# Design: 003-ai-edge-cases

## 1. Arquitetura de Correção (Backend / Supabase)

### Solução para Race Conditions (Debounce de Webhook)
Não podemos engatilhar a Edge Function `ai-autonomous-evaluator` imediatamente no `chatwoot-webhook`.
- **Estratégia:** O Webhook apenas salva a mensagem. Um Trigger no Postgres ou um Deno Cron Job rodando a cada 1 minuto (ou via Supabase pg_cron) varre a tabela `chat_messages` procurando conversas cuja última mensagem foi enviada há mais de X segundos (debounce). Somente quando o cliente "parou de digitar" é que a IA processa o bloco.

### Solução para Multimídia
- Atualizar `chat_messages` e o Webhook para garantir que se o `payload.attachments` existir no Chatwoot, ele seja extraído como `media_url` e `media_type`.
- No Prompt da IA, injetar metadados estruturados: `[ANEXO ENVIADO PELO GERENTE: video/mp4]`. Assim, a IA sabe que um vídeo foi mandado, mesmo sem "assistir" ao vídeo (se `vision` estiver desligado), dando a nota de compliance.

### Solução para Vector DB Cache
- Fornecer ao usuário o SQL exato para executar no editor do Supabase, garantindo que o `pgvector` seja ligado manualmente, já que os métodos automatizados falharam.

## 2. Design UI/UX (Frontend)

### Componente de Feedback da IA
- **Onde:** Dentro do `AuditPanel.tsx`.
- **O Quê:** Adicionar um campo `ai_feedback` na tabela `leads`.
- **Estética (Liquid Glass 2026):** Uma caixa *inline* sutil no topo do dossiê, com fundo `bg-indigo-500/10` e borda `border-indigo-500/30`. Um ícone de Sparkles (✨) indicando que foi gerado por IA. Se a nota for vermelha, a caixa puxa tons de `rose-500/10`. A tipografia deve ser amigável e instrutiva.
