# Proposal: Correção de Exibição do Histórico de Vistorias (bugfix-audits-display)

## Problema
Atualmente, as auditorias recentes no dashboard (`Auditoria/index.tsx`) estão aparecendo com o status "—" (sem nota) e não aparecem na página de Histórico (`AuditHistory.tsx`), impedindo o usuário de clicar e ver os detalhes.
Isso ocorre devido a uma inconsistência no filtro de status e na forma como o score é calculado. O widget da Home não filtra por status (trazendo testes/lixos antigos ou execuções autônomas) e tenta calcular o score buscando o objeto `categories` dentro de `raw_payload`, que não existe nesses casos. Já a página de Histórico filtra rigidamente por `status = 'synced'` e também tenta recalcular o score na mão ao invés de usar a coluna nativa `score` do banco de dados.

## Solução Proposta
1. Padronizar o filtro de status em ambos os componentes, permitindo exibir auditorias cujo status seja `synced` (manual) ou `completed` (IA/testes).
2. Modificar a lógica de cálculo do Score em ambos os componentes para priorizar a coluna `score` nativa da tabela `store_inspections`. Caso a coluna seja `null`, faz o fallback para o cálculo legado via `raw_payload.categories`.
3. Adicionar tratamento defensivo na UI do Drawer (Histórico) para exibir algo consistente (ou uma mensagem amigável) quando não houver `categories` no payload (ex: auditorias geradas por IA).

## Contratos de Dados
- Nenhuma alteração no esquema do banco. A tabela `store_inspections` já possui a coluna `score`.

## API / Interface
- **Modificações**:
  - `src/pages/Auditoria/index.tsx`: Atualizar a query `select` para incluir a coluna `score` e o filtro `in('status', ['synced', 'completed'])`.
  - `src/pages/AuditHistory.tsx`: Atualizar a query para `in('status', ['synced', 'completed'])`. Atualizar renderização do card e do Drawer.

## Features Existentes Impactadas
- Tela Principal de Auditoria (Dashboard)
- Tela de Histórico de Auditoria

## Risco Principal
Como a renderização do Drawer no Histórico exige `audit.raw_payload.categories` para mostrar as fotos, ao permitir exibir auditorias de IA (status = `completed`), o Drawer pode ficar em branco ou quebrar caso não exista tratamento defensivo para a ausência do array de `categories`.
*Mitigação*: Criar fallback visual no Drawer. Se `categories` for undefined, exibir as chaves/valores do JSON (ex: `audit_checklist`) em um bloco formatado.
