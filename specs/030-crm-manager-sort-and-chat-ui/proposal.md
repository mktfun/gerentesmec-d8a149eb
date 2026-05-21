# Proposal: UX do CRM, Ordenação e Status de Gerentes

## Objetivos
1. Resolver a exibição inconsistente de "Sem Gerente" nos cards do CRM Kanban, garantindo que a unidade atribua visualmente seu gerente correspondente, caso o lead não o tenha assinalado.
2. Alterar a lógica de ordenação das colunas do Kanban para priorizar a ordem cronológica da última interação (`last_message_at` DESC), fazendo com que as conversas mais quentes fiquem no topo.
3. Exibir no Card do CRM há quantos minutos ocorreu a última interação da conversa, independente de quem falou por último.
4. Refinar a interface do `AuditPanel` e `ChatHistoryView`, adicionando o botão de Link Externo simplificado e ajustando o label de status de "Online no Chatwoot" para "Canal Online".

## User Stories
1. Como gerente, eu quero ver minha foto/nome nos leads da minha unidade no Kanban, mesmo que o sistema de integração não tenha assinalado meu ID diretamente no lead.
2. Como gerente, eu quero que as conversas que acabaram de receber ou enviar mensagens pulem para o topo da coluna do Kanban, para eu saber onde a ação está acontecendo.
3. Como auditor, eu quero ver no card do lead "5m" ou "2h", indicando o tempo decorrido desde a última mensagem trocada.
4. Como auditor, eu quero um link rápido (ícone discreto de seta externa) ao lado do nome do cliente para abrir a conversa original no sistema de origem, sem textos longos poluindo a tela.

## BDD Scenarios

### Cenário: Fallback visual do Gerente
- **Dado** que o Lead "Mario" pertence à unidade "Dom Pedro" (que possui o gerente "Leandro"), mas `manager_id` no banco é `null`.
- **Quando** o card do Lead é renderizado no Kanban.
- **Então** o sistema busca o primeiro gerente da unidade "Dom Pedro" e exibe "Leandro - Dom Pedro" em vez de "Sem Gerente".

### Cenário: Ordenação por Atividade Recente
- **Dado** que há dois leads na mesma etapa do funil: Lead A (última mensagem há 5 minutos) e Lead B (última mensagem há 1 hora).
- **Quando** a coluna renderiza os leads.
- **Então** o Lead A aparece no topo, seguido pelo Lead B.
