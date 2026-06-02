# Tasks (006-ai-accuracy-ui-fixes)

## Checklist de Implementação (Passo a Passo Estrito)

### 1. Migrações e Tipos (Database)
- [x] Criar migration no Supabase adicionando a coluna `audit_reasons` (JSONB) na tabela `leads`.
- [x] Criar migration no Supabase adicionando a coluna `ai_transcription` (TEXT) na tabela `chat_messages`.
- [x] Rodar a migration (VIA PAINEL SQL devido a erro de sync local do histórico).
- [ ] Gerar os tipos Typescript usando `supabase gen types typescript` (Opcional, usando any/casting no React).

### 2. Engenharia de Prompt Severa & Função `ai-autonomous-evaluator`
- [x] Atualizar as JSON schemas (Response Format) da IA para exigir que `reasoning_step_by_step` seja a **primeira** chave do JSON. A IA deve justificar tudo lá antes de outputar o checklist.
- [x] Atualizar o System Prompt com *Few-Shot Examples* contendo gírias ("manda bala", "pode marchar", "ok", "tá caro") e casos de recusa ou falta de clareza (ex: agradecer mas não finalizar).
- [x] Adicionar *Negative Constraints* no prompt: "PROIBIDO marcar X se Y não tiver acontecido".
- [x] Implementar Progressão Estrita de Funil no backend: a Edge Function irá descartar o `funnel_stage` devolvido pela IA se ele representar um retrocesso.
- [x] Tratar caso de mídia recebida e retornar o resumo no campo `media_summaries` do retorno JSON da IA, que será então atualizado no campo `ai_transcription` do `chat_messages`.
- [x] Deploy da função.

### 3. Ajuste de UI (`ChatHistoryView.tsx`)
- [x] Remover a lógica antiga de extrair os items `event` isolados do `buildTimeline`.
- [x] No `MessageItem`, checar se a mensagem consta em `lead.audit_checklist_messages`. Se sim, obter o motivo correspondente de `lead.audit_reasons` (que virá do `reasoning_step_by_step` da IA).
- [x] Injetar a div de "AI Annotation" minimalista abaixo do balão do usuário na UI.
- [x] Atualizar o componente para renderizar o `msg.ai_transcription` sob os players de áudio/vídeo de forma sutil.

### 4. Validação
- [x] (Revisão estática de código) Rodar uma avaliação contra uma mensagem que usaria gíria ("manda bala") e checar se o funil avança corretamente graças ao novo raciocínio.
- [x] Testar falsa positiva de Agradecimento ("Valeu").
- [x] Testar regressão (enviar "oi" para lead closed_won) e garantir bloqueio na API.
