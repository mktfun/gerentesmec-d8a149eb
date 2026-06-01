# Checklist de Tarefas - Spec 018

### 1. Modelagem do Banco (Supabase SQL)
- [ ] Criar tabela `daily_digests` (campos `id`, `created_at`, `target_date`, `summary_text`, `leads_processed`).
- [ ] Adicionar coluna `off_hours_batching BOOLEAN DEFAULT TRUE` na tabela `ai_settings`.
- [ ] Habilitar RLS e policies básicas em `daily_digests` (leitura publica auth).
- [ ] Atualizar `src/integrations/supabase/types.ts` com as novas definições de tabelas.

### 2. Edge Function `chatwoot-webhook`
- [ ] Incorporar utilitário `isInsideBusinessHours` (da `businessHours.ts`) na função Deno.
- [ ] Fazer a Edge Function ler a coluna `off_hours_batching` e as configurações de `business_hours`.
- [ ] Adicionar um log e o `return new Response(...)` de sucesso antes da linha de invocação do Evaluator caso esteja fora do expediente e o lote estiver ativo.

### 3. Nova Edge Function `ai-daily-consolidator`
- [ ] Criar a pasta e arquivo em `supabase/functions/ai-daily-consolidator/index.ts`.
- [ ] Lógica para varrer a tabela `chat_messages` procurando mensagens feitas após a hora de encerramento do último dia útil, agregando os IDs dos leads afetados.
- [ ] Fazer um loop (ou map `Promise.all` em pequenos lotes) que dispare uma chamada HTTP (autenticada) internamente para o `/functions/v1/ai-autonomous-evaluator` forçando a auditoria de cada lead.
- [ ] Compilar um JSON ou string das auditorias finalizadas ("Antes/Depois" ou os Checklist resultantes).
- [ ] Enviar prompt unificado para a API de LLM (gemini-2.5-flash via Local Proxy ou Fallback Google) pedindo "Daily Digest Executivo".
- [ ] Inserir resposta do Digest na tabela `daily_digests`.

### 4. UI / Frontend (React)
- [ ] Alterar `AiRouterConfig.tsx`:
  - Adicionar o Switch/Toggle de "Lote Fora de Expediente".
  - Adicionar o botão "Executar Auditoria Matinal Agora" (ao invés de aguardar o cron).
- [ ] Alterar ou criar um Componente `DailyDigestsView.tsx`:
  - Fetch de `daily_digests` no Supabase, ordene por `created_at DESC`.
  - Exibição de cards expansíveis em Markdown com a leitura do relatório matinal.
  - Colocar no menu lateral ou em uma aba discreta (Ex: ao lado de Log do LLM em Configurações, ou botão na Navbar principal).

### 5. Finalização
- [ ] Validação End-to-End via API (acionamento manual do consolidator).
- [ ] Agendar `pg_cron` (opcional, pode ser orientado para o usuário rodar script SQL) para executar `ai-daily-consolidator` todos os dias de semana às 08:00 AM.
