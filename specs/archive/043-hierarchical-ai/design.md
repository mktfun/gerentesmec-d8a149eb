# Design: IA Hierárquica e "Zero-Hallucination"

## 1. Modificações de Banco de Dados (Supabase)
### Tabelas
- Adicionar coluna `ai_scratchpad` (text) na tabela `leads` (onde o Agente Rastreador deixará notas compactadas da conversa).
- A tabela `chat_messages` continua recebendo as transcrições assíncronas do `transcribe-audio`.

## 2. Nova Arquitetura de Edge Functions
O monolito `ai-autonomous-evaluator` será desmembrado:

### Edge Function 1: `ai-funnel-tracker` (O Rastreador Rápido)
- **Gatilho:** `pg_cron` a cada 5 minutos.
- **Payload:** ID do Lead.
- **Processo:**
  1. Busca as mensagens que ainda não foram trackeadas (`ai_audited = false`).
  2. Chama um modelo rápido e barato (Haiku ou GPT-4o-mini).
  3. O modelo atualiza a fase do funil `funnel_stage` (se detectar avanço).
  4. Adiciona um resumo da interação no `ai_scratchpad`.
  5. Marca as mensagens como `ai_audited = true`.
- **Regra Rígida:** Não emite score nem preenche checklist.

### Edge Function 2: `ai-final-auditor` (O Juiz Completo)
- **Gatilho:** Webhook de alteração (Trigger no Supabase) quando o `funnel_stage` do lead mudar para `closed_won` ou `closed_lost` (seja pelo gerente ou pelo Rastreador).
- **Processo:**
  1. Carrega todas as mensagens do lead (já transcritas e com áudio/vídeo-descrições).
  2. Avalia a densidade do contexto. Se estiver caótico, cheio de falhas ou sem áudios cruciais, ele para a execução e move o lead para `needs_context` (Sem Contexto).
  3. Se o contexto for bom, ele invoca a API do provedor com base na configuração da tela (Opção **"Otimização Máxima"**, garantindo o uso das versões flagship mais recentes de 2026 para cada provedor, sem hardcodar versões defasadas).
  4. Preenche o `audit_checklist` detalhado e a pontuação `score`.
  5. Salva a avaliação definitiva usando a RPC `saveLeadAudit`, **junto com o trecho exato ("nota de evidência")** justificando a marcação (ex: *"Marcado porque o cliente respondeu 'Sim, eu aceito' em áudio transcrito às 14:30"*).

## 3. CLI Agent Runner (Gêmeo Local)
- Criação de um manual/prompt mestre (`scripts/ai-cli-runner.md`) para o `agy` ou `gemini cli`.
- **Conteúdo:** Instruções de como bater direto no Supabase via REST/PostgREST localmente, system prompt completo do "Agente Auditor", e schemas das tabelas (`leads`, `chat_messages`).
- **Objetivo:** O usuário pode rodar a IA do terminal dele ("nem parece que é um cli fazendo o trabalho"), tendo controle total sem depender do Supabase Edge Functions.

## 4. Impacto no Frontend
- O **Kanban** ganha a nova coluna "Sem Contexto" (`needs_context`).
- O **Painel de Auditoria (AuditPanel)** receberá um novo estado: "Em Progresso", "Auditoria Concluída" ou "Aguardando Contexto" (exigindo ação humana).

## 5. Segurança e Fallbacks
- Se um lead for movido manualmente pelo gerente para "Ganho", a trigger do banco chama o Auditor automaticamente.
- Teremos um botão no Front-end: **"Forçar Auditoria Parcial"**, caso o gerente queira saber o checklist no meio do caminho, pagando o custo manualmente.
