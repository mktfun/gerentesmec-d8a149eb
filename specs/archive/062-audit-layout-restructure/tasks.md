# Tasks: 062 Audit Layout Restructure

- [x] 1. Configurar Roteamento em `App.tsx`
  - Criar rota `/auditoria/execucao` em TODOS os blocos de autenticação (Admin, UnitManager, Auditor) renderizando o componente `AuditoriaExecution` FORA de layouts de navegação.
  - Para `isAuditor`, envolvê-lo no `ManagerLayout` (já que tem LumaBar e é limpo) para a rota `/auditoria` e `/historico-auditorias`.

- [x] 2. Criar `src/pages/Auditoria/AuditoriaExecution.tsx`
  - Extrair a lógica do Stepper (quando `draft` é true) do antigo `index.tsx` para este novo arquivo.
  - Adicionar um `useEffect` que faz `navigate('/auditoria')` se `draft` for nulo ao montar.

- [x] 3. Refatorar `src/pages/Auditoria/index.tsx`
  - Remover o wrapper `h-screen bg-[#0a0a0f]`.
  - Implementar Grid de 2 colunas.
  - Manter a lógica de criar novo rascunho.
  - Ao clicar em iniciar ou continuar, navegar para `/auditoria/execucao`.

- [x] 4. Criar Painel de "Últimas Vistorias" na coluna da direita
  - Buscar `store_inspections` com `.select('id, store_id, final_score, completed_at, units(name)')`.
  - Renderizar lista formatada com cores dependendo do score.
