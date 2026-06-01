# Tasks - Background Historical Auditor

- [ ] **1. Expandir Schema UI do AdvancedAiPanel**
  - Adicionar Switch `autoProcessQueue` (persistido via LocalStorage ou DB).
  - Adicionar controle de cadência (ex: 5s, 10s, 30s) `cooldownSeconds`.
  - Exibir status "Idle", "Processando", "Cooldown (Xs)".

- [ ] **2. Lógica do Background Auditor Hook**
  - No React (no componente de Queue ou no Contexto), implementar um `useEffect` que executa condicionalmente (se `autoProcessQueue` for `true`).
  - Lógica: Buscar a próxima mensagem não auditada limit=1. 
  - Se não houver, dorme por 1 minuto.
  - Se houver, invoca `ai-autonomous-evaluator` passando essa única mensagem.
  - Após a resposta (200 OK), aplica um Timeout (`setTimeout`) usando o `cooldownSeconds`.

- [ ] **3. Proteção contra Crash em Loop (Exponential Backoff)**
  - Se a Edge Function retornar 500 (ou o Proxy estiver offline), e a flag estiver ativada:
    - Aplicar uma pausa forçada de 2 minutos antes da próxima tentativa, alterando o status UI para "Pausado (Erro) - Tentando de novo em 120s".

- [ ] **4. Teste de Carga**
  - Ligar o "Auto-Processar Fila", injetar mensagens fictícias com `ai_audited = false` e acompanhar se as requisições estão ocorrendo individualmente na cadência correta (verificar Aba Network do navegador).
