# Tarefas - Dashboards para TV & Relatório Read-Only

- [ ] **Passo 1 (Refatoração Relatórios):**
  - Criar `src/components/Crm/ReadOnlyAuditPanel.tsx`.
  - Este componente deve receber o `lead` e listar os `auditStepsConfig`, cruzando com a propriedade `lead.audit_checklist` (se item está checked) e mostrando as targets de scroll para o chat.
  - O componente deve chamar `ChatHistoryView` passando o ID da mensagem para destacar.
  - Atualizar `Relatorios.tsx` para usar este `ReadOnlyAuditPanel` quando um lead for clicado. O modal continua largo para caber as duas colunas.
- [ ] **Passo 2 (Roteamento TV):** 
  - Criar componente `TvLayout.tsx` (sem Sidebar, padding fullscreen).
  - Atualizar `App.tsx` para abrigar as rotas `/tv/operacional` e `/tv/executivo` dentro deste novo `TvLayout`.
- [ ] **Passo 3 (Dashboard Operacional):**
  - Criar `src/pages/tv/TvOperacional.tsx`.
  - Usar os hooks existentes do `AppDataContext` (`calculateTmr`, `calculateDangerLeads`, etc) para buscar as métricas reais.
  - Implementar UI com métricas gigantes: "Atendimentos em Fila / SLAs", "TMR Geral" e carrossel de alertas.
- [ ] **Passo 4 (Dashboard Executivo):**
  - Criar `src/pages/tv/TvExecutivo.tsx`.
  - Listar o Top 3 Gerentes (Performance Score IA).
  - Adicionar o Anel Global de Score da Rede.
  - Remover referências ao Financeiro de Orçamentos (grana na mesa).
