# Tasks: Correção Avançada dos Filtros de Relatório em Lote

- [ ] Modal de Opções de Exportação (`ExportOptionsModal.tsx`)
  - [ ] Adicionar o estado `filterMode` ('OR' | 'AND').
  - [ ] Renderizar Toggle UI para selecionar entre lógica 'OR' e 'AND'.
  - [ ] Atualizar o botão de exportar para enviar o `filterMode` no callback.

- [ ] Lógica de Exportação (`Relatorios.tsx` -> `handleExportPDF`)
  - [ ] Remover hardcode `sevenDaysAgo` que estava sobrepondo o calendário da UI.
  - [ ] Substituir o filtro de data para usar o array `filteredLeads` que já aplica a data do calendário global ou manualmente recriar a lógica usando `dateRange.from` e `dateRange.to`.
  - [ ] Criar a função `isFailed(val)` para interpretar corretamente `false` nativo, string `'false'` e `undefined/null`.
  - [ ] Adicionar um switch/if para respeitar o `filterMode` ('OR' vs 'AND') vindo do modal de opções e aplicando a função `some` ou `every` sobre os `unmarkedChecks`.
