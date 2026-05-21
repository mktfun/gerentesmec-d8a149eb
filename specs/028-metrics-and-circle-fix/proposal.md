# Proposal: Correção de Métricas de Tempo e UI do Círculo

## Objetivos
1. Corrigir o SVG cortado no Card da Unidade (TV Mode), garantindo que o círculo de score seja perfeitamente redondo.
2. Garantir que as métricas de "Tempo Médio" (TMR) e "Leads em Alerta (>20m)" no `TvDashboard` e no `Index` só contabilizem o tempo de espera do cliente (quando ele mandou a última mensagem e a unidade ainda não respondeu).
3. Consolidar o cálculo de `wait_time_minutes` baseado na nova lógica estrita: "Tempo de espera do cliente".

## User Stories
1. Como gestor visualizando a TV, eu quero que o círculo de % da performance seja renderizado corretamente sem cantos cortados.
2. Como gestor analisando a fila, eu quero que o TMR mostre 0 se nenhum cliente estiver esperando resposta da minha equipe naquele momento, e apenas some os minutos dos clientes que estão de fato na fila esperando.
3. Como gestor visualizando o Dashboard (Index), eu quero que os "Leads em Alerta (>20m)" não pitem para orçamentos que minha equipe já respondeu (onde a última mensagem foi nossa).

## BDD Scenarios

### Cenário: Cliente esperando resposta
- **Dado** que um cliente enviou uma mensagem há 25 minutos e o gerente não respondeu.
- **Quando** o sistema contabiliza o TMR e Alertas.
- **Então** esse lead contribui com 25min para a média geral e entra na contagem de Leads em Alerta (>20m).

### Cenário: Gerente respondeu por último
- **Dado** que o gerente enviou a última mensagem em um lead.
- **Quando** o sistema contabiliza o TMR e Alertas.
- **Então** esse lead contribui com 0min para o TMR (ele não está esperando) e não aciona o alerta de SLA.
