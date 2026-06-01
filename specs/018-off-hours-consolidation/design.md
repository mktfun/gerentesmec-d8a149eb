# Design Técnico - Spec 018

## 1. Modificações no Banco de Dados (Supabase)
### Tabela `daily_digests`
Para guardar os relatórios de fim de dia/matinais.
```sql
CREATE TABLE public.daily_digests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  target_date DATE NOT NULL, -- a data/dia do qual o relatório se trata
  summary_text TEXT NOT NULL,
  leads_processed INT DEFAULT 0
);
```

### Tabela `ai_settings`
Adição de um toggle para ligar/desligar a consolidação noturna.
```sql
ALTER TABLE public.ai_settings ADD COLUMN off_hours_batching BOOLEAN DEFAULT TRUE;
```

## 2. Modificações na Edge Function `chatwoot-webhook`
A função `isInsideBusinessHours` deve ser implementada/trazida do `src/utils/businessHours.ts`.
Antes de chamar o `fetch` para o `/functions/v1/ai-autonomous-evaluator`:
- Verifica as configurações de `ai_settings.off_hours_batching`.
- Verifica as `integration_settings.business_hours`.
- Se `off_hours_batching === true` E a mensagem atual chegou **fora do expediente**, pulamos o gatilho da IA. Apenas logamos: `[webhook] Fora do expediente, mensagem salva em fila pendente. Evaluator NÃO acionado.`

## 3. Nova Edge Function: `ai-daily-consolidator`
Uma nova edge function que será invocada por CRON (ou botão manual na UI).
- Passo 1: Buscar leads cuja `last_message_at > last_evaluation_at` (ou simplificar buscando conversas que tiveram mensagem nas últimas N horas da noite e que não estão avaliadas hoje). Ou apenas buscar todos os leads que estão com status pendente (talvez adicionar uma flag ou usar as datas). Para simplificar e não precisar de uma flag nova que exigiria muita migração, podemos buscar na tabela `chat_messages` mensagens feitas desde as 18:00 (ou o fim do expediente) até o momento atual que sejam do tipo `contact` ou `user`. Pegar o `lead_id` delas com um `DISTINCT`.
- Passo 2: Fazer um loop em cada `lead_id` encontrado. Enviar o ID para a API local de `ai-autonomous-evaluator` (reuso de lógica).
- Passo 3: Depois que todos os leads pendentes estiverem atualizados, buscar os logs (`audit_checklist` ou memórias) deles.
- Passo 4: Fazer um mega-prompt em `gemini-2.5-flash` para analisar o conjunto.
- Passo 5: Salvar a resposta do Gemini em `daily_digests`.

## 4. UI / Frontend (Stitch UI Compatível)
**Config > IA**:
- Adicionar no form a chave (Toggle) "Ativar Lote Fora de Expediente (Daily Digest)".
- Adicionar um Botão "Executar Auditoria Matinal Agora" que dispara o `fetch` para `/functions/v1/ai-daily-consolidator`.

**Nova Tela (Page/Modal): "Daily Digests"**:
- Ficará discreta, talvez no topo do Chat Dashboard ou em "Histórico IA". Uma view simples lendo a tabela `daily_digests` ordenada de forma decrescente.
- O relatório será renderizado via Markdown para facilitar visualização de highlights.
