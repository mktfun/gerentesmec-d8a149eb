# Proposta: 012-task-queue-heartbeat

## Resumo
Corrigir a visibilidade dos logs de telemetria para o provider **Local AI Proxy (CLI Tunnel)** e implementar um mecanismo de **heartbeat + retry automático** na fila de tarefas da IA (`ai_task_queue`), de forma que quando o proxy local estiver offline as tasks fiquem "seguras" na fila e sejam reprocessadas automaticamente assim que o túnel voltar a responder com 200.

## Requisitos

### R1 — Logs de Telemetria visíveis para Local AI Proxy
- O dropdown de filtro do `ProviderMonitoring.tsx` deve incluir a opção "Local AI Proxy (CLI Tunnel)"
- Os logs gerados pelo evaluator quando usa o proxy local devem aparecer normalmente na tabela e nos gráficos

### R2 — Heartbeat do Provider
- O backend deve ter uma forma de verificar periodicamente se o provider ativo está respondendo (ping `GET /` na URL do túnel)
- O resultado do heartbeat (online/offline) deve ser visível na UI (no painel da fila de tarefas)
- Quando offline, novas mensagens devem ser enfileiradas como `pending` mas NÃO processadas

### R3 — Retry Automático de Tasks com Erro
- Tasks com `status = 'error'` causadas por falha de túnel (502, 530, ou fetch error) devem ser elegíveis para retry
- Quando o heartbeat detectar que o provider voltou (200), deve reprocessar automaticamente as tasks pendentes/com erro
- Máximo de 3 retries por task para evitar loops infinitos

### R4 — Backpressure Visual
- O `TaskQueuePanel` deve mostrar claramente quando o sistema está em modo "aguardando provider"
- Deve haver um botão manual de "Reprocessar Falhas" para forçar retry sem esperar o heartbeat

---

## User Stories

### US-1: Engenheiro monitora logs do proxy local
**Como** engenheiro do sistema,
**Quero** ver os logs de telemetria das chamadas feitas pelo Local AI Proxy,
**Para que** eu consiga diagnosticar latência, erros e uso de tokens do meu proxy local.

### US-2: Sistema aguarda túnel voltar e reprocessa
**Como** sistema autônomo,
**Quero** segurar as tasks na fila quando o túnel estiver offline e reprocessá-las quando voltar,
**Para que** nenhuma mensagem de conversa seja perdida ou ignorada.

### US-3: Engenheiro força reprocessamento manual
**Como** engenheiro,
**Quero** poder clicar em "Reprocessar Falhas" a qualquer momento,
**Para que** eu tenha controle direto sobre o fluxo de avaliação.

---

## BDD Scenarios

### Cenário: Logs do Local AI Proxy aparecem na telemetria
- **Given (Dado):** O provider ativo é "Local AI Proxy (CLI Tunnel)" e uma mensagem foi processada com sucesso
- **When (Quando):** O engenheiro abre a aba "Métricas & Telemetria" e filtra por "Local AI Proxy"
- **Then (Então):** O log aparece na tabela com provider "Local AI Proxy (CLI Tunnel)", latência, tokens e botão "Ver Detalhes"

### Cenário: Heartbeat detecta túnel offline
- **Given (Dado):** O provider ativo é "Local AI Proxy (CLI Tunnel)" e a URL do túnel está inacessível
- **When (Quando):** O heartbeat executa um `GET` na URL do túnel
- **Then (Então):** O status do heartbeat muda para "Offline" (vermelho) e novas tasks ficam como `pending` sem serem processadas

### Cenário: Retry automático quando túnel volta
- **Given (Dado):** Existem 3 tasks com `status = 'error'` e `error_message` contendo "Túnel Offline"
- **When (Quando):** O heartbeat detecta que o túnel voltou (200 OK)
- **Then (Então):** As 3 tasks são automaticamente reprocessadas e seus status mudam para `running` → `success`

### Cenário: Reprocessamento manual
- **Given (Dado):** Existem tasks com erro na fila
- **When (Quando):** O engenheiro clica no botão "Reprocessar Falhas"
- **Then (Então):** Todas as tasks elegíveis são reenviadas para o evaluator e seu status é atualizado em tempo real

### Cenário: Limite de retries respeitado
- **Given (Dado):** Uma task já foi tentada 3 vezes e falhou todas
- **When (Quando):** O heartbeat detecta o túnel online novamente
- **Then (Então):** A task NÃO é reprocessada e permanece com `status = 'error'` + flag `max_retries_exceeded`
