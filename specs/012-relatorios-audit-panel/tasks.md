# Tarefas - Audit Panel em Relatórios

- [ ] **Passo 1 (Relatorios.tsx - Imports):** 
  - Importar o componente `AuditPanel` em vez de `ChatHistoryView`.
  - Remover estados não utilizados (`modalMessages`, `isLoadingMessages`) e o `useEffect` relacionado à busca de mensagens.
- [ ] **Passo 2 (Relatorios.tsx - Componente):**
  - Ajustar a largura do modal de `md:w-[600px]` para `md:w-[85vw] lg:w-[1200px]`.
  - Substituir `<ChatHistoryView ... />` por `<AuditPanel lead={selectedLead} onClose={() => setSelectedLeadId(null)} />`.
- [ ] **Passo 3 (Verificação):** 
  - Rodar o linter/TS para assegurar que não haja dependências fantasma quebrando.
