# Tasks: Reports, TV Mode, Kanban Fixes & CRUDs (012)

## Fase 1: Data Model & Contexto Global
- [ ] Atualizar `src/data/mockData.ts` adicionando `ticket_value` aos Leads.
- [ ] Criar `src/context/AppDataContext.tsx` para gerenciar o estado global de Leads e Managers (permitindo CRUD client-side que reflita em todas as telas).
- [ ] Instalar `@hello-pangea/dnd` (`npm install @hello-pangea/dnd`).

## Fase 2: Gestão de Gerentes (CRUD)
- [ ] Criar `src/components/Gerentes/ManagerModalForm.tsx` (Add/Edit/Delete).
- [ ] Integrar no `Gerentes.tsx` o botão e o modal com o context.

## Fase 3: Gestão de Leads (CRUD)
- [ ] Criar `src/components/Crm/LeadModalForm.tsx` (Add/Edit/Delete) focado em furtividade (sem mencionar integrações).
- [ ] Adicionar botão "Novo Atendimento" no `Crm.tsx`.

## Fase 4: Refatoração Kanban & Drag/Drop
- [ ] Reescrever `KanbanView.tsx` para usar `@hello-pangea/dnd`.
- [ ] Ajustar layout das colunas no `KanbanView.tsx` para scroll interno.
- [ ] Adicionar display do `ticket_value` no `KanbanCard.tsx`.
- [ ] Persistir no `AppDataContext` o novo status do lead após o drag.

## Fase 5: Tela de Relatórios e Filtros
- [ ] Criar `src/pages/Relatorios.tsx` com filtros de datas "fake" que simulam atualização de dados.
- [ ] Adicionar rota em `App.tsx` e Sidebar.

## Fase 6: TV Mode (Dashboard)
- [ ] Adicionar botão "TV Mode" no `Index.tsx`.
- [ ] Ajustar `DashboardLayout.tsx` para respeitar um state `isTvMode` (esconder sidebar e expandir main).

## Fase 7: Build & Deploy
- [ ] Validar o build.
- [ ] Commit e Push.
