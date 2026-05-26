# Proposal: Audit Persistence Fix (024)

## Requisitos
- Garantir que o estado dos checkboxes da auditoria de atendimento (Quality Assurance) sejam persistidos de forma confiável no banco de dados.
- O sistema atual tenta usar uma coluna JSONB (`audit_checklist`) na tabela `leads`, mas devido a problemas de cache do schema no PostgREST e dessincronização de tipagem no cliente Supabase, a atualização falha silenciosamente.
- A solução deve eliminar falhas silenciosas ao salvar as opções marcadas.

## User Stories
- Como Gerente, quero marcar itens específicos da auditoria de um dossiê e ter a certeza de que, ao fechar e reabrir o dossiê, os exatos mesmos itens continuarão marcados.
- Como Gerente, quero que a nota percentual reflita exatamente os itens que estão salvos no banco.

## BDD Scenarios

### Cenário: Salvando checklist de auditoria de forma confiável
- **Given (Dado):** O gerente abriu o painel de auditoria de um lead que possui 0% de score.
- **When (Quando):** O gerente marca 3 itens do checklist e clica em "Salvar Auditoria".
- **Then (Então):** Os 3 itens marcados devem ser salvos em uma tabela relacional segura, a nota do lead deve ser atualizada para refletir esses 3 itens, e ao recarregar a página, as 3 caixas devem aparecer checadas.
