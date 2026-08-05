# Spec Plan: Auditoria Autônoma de Gerentes (gerentes-audit)

## Tasks (Plano de Exportação/Implementação)

Estas tasks servem como guia para o desenvolvedor ao criar o Novo App ou estender a infraestrutura atual.

- [ ] [BACKEND] Criar tabela `manager_conversations_state` para state-machine de mensagens do Chatwoot
- [ ] [BACKEND] Criar tabela `manager_inspections` com RLS Pública para auditorias (similar a `store_inspections`)
- [ ] [BACKEND] Criar/Modificar Edge Function `chatwoot-ingest` para separar mensagens das atendentes das mensagens dos gerentes (usando os inbox_ids específicos).
- [ ] [BACKEND] Criar Edge Function `incremental-summarizer` (Uso de modelo barato, ex: Flash/Haiku) acionada a cada batch de 20 mensagens (ou inatividade).
- [ ] [BACKEND] Criar CRON Job `check-closed-conversations` que roda a cada 10 min buscando conversas fechadas no Chatwoot para engatilhar a auditoria.
- [ ] [BACKEND] Portar o super-prompt "O Cérebro Inquisidor" e o JSON Schema para a Edge Function `final-auditor`.
- [ ] [FRONTEND] Clonar o componente `AuditorsPanel` criando uma Tab `Visão Gerentes`.
- [ ] [FRONTEND] Criar UI de exibição do `manager_failures` e do `audit_checklist` na dashboard.
- [ ] [TEST] Verificar cenário de conversa curta (encerra sem acionar summarizer incremental).
- [ ] [TEST] Verificar cenário de longa duração (summarizer concatena histórico sem perder o momento do preço/quebra de objeção).
