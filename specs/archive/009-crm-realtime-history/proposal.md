# Proposal: Ajuste de Métricas, Realtime e Visualizador de Histórico

## Requisitos
1. **Métricas de Relatórios (Performance por Etapa)**: A matemática deve considerar o total absoluto de leads do gerente no período como base para calcular a média de cada etapa (E1, E2, E3, E4) e do Score Geral. Leads não pontuados devem diluir a nota para baixo.
2. **Visualizador de Histórico de Mensagens**: Uma interface que permita clicar em um lead no quadro Kanban e abrir um painel contendo todas as mensagens salvas na tabela `chat_messages` referentes a este lead, para fins de auditoria e contexto.
3. **Sincronização Realtime**: Garantir que as atualizações de leads e novas mensagens atualizem a interface do Kanban sem necessidade de recarregar a página.

## BDD Scenarios

### Cenário: Cálculo de Score Baseado no Volume
- **Given (Dado):** O gerente "Lucas" atendeu 10 leads no mês, mas apenas 5 receberam auditoria (todos com 100% nas etapas E1, E2, E3 e E4).
- **When (Quando):** O administrador acessa a tela de Relatórios e visualiza a Performance por Etapa de Lucas.
- **Then (Então):** As colunas de E1, E2, E3 e E4, bem como o Score Geral de Lucas, devem exibir 50% (5 leads com 100% divididos pelo total de 10 leads do período).

### Cenário: Visualização de Histórico de Mensagens
- **Given (Dado):** Um lead auditado no painel de CRM.
- **When (Quando):** O usuário clica sobre o botão "Ver Histórico" (ou sobre o card) no painel Kanban.
- **Then (Então):** Um painel elegante (Liquid Glass) desliza na tela exibindo as mensagens do banco de dados, em ordem cronológica, diferenciando mensagens de cliente e mensagens do consultor/gerente.

### Cenário: Kanban Atualizando em Tempo Real
- **Given (Dado):** O painel de CRM (Kanban) aberto no navegador.
- **When (Quando):** O Webhook recebe uma nova mensagem do Chatwoot e atualiza a coluna `last_message_at` do lead na tabela `leads`.
- **Then (Então):** O card do lead no CRM deve reordenar sozinho para o topo da respectiva coluna imediatamente, refletindo a nova prioridade SLA.
