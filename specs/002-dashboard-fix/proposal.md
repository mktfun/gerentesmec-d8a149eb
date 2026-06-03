# Proposal: Dashboard Redesign & Chart Fixes

## Requisitos de Negócio
1. O executivo deve ter uma visão de "Saúde Geral" no Dashboard principal (`Index.tsx`) através de um painel esquerdo robusto e gráfico de evolução consertado.
2. O executivo deve visualizar um ranking das "Top 3 Lojas" em uma barra lateral / coluna à direita.
3. O gráfico de evolução histórica não deve mostrar os dias passados como "zero" se houver escassez de dados, mantendo a média ou a fluidez da linha com fallback semântico.
4. O Score Diário em `Relatorios.tsx` deve deixar explícito o cálculo caso não existam auditorias na data (evitando confusão de "zero").

## BDD Scenarios

### Cenário: Renderização do Gráfico de Evolução com Dados Escassos
- **Given (Dado):** que o sistema é novo e só possui auditorias realizadas hoje
- **When (Quando):** o Dashboard Executivo (`Index.tsx`) calcula o histórico de 7 dias
- **Then (Então):** o sistema deve aplicar um "Backfill" retroativo e preencher a linha do gráfico para trás em linha reta, em vez de derrubá-la para 0%.

### Cenário: Visualização do Dashboard Executivo
- **Given (Dado):** que o usuário de nível Executivo (ex: Daniel) acessa a tela inicial
- **When (Quando):** a página é carregada
- **Then (Então):** o layout deve apresentar duas colunas: a esquerda (com 2 grandes blocos: Saúde Geral e Gráfico) e a direita (com o Ranking das Top 3 Unidades).

### Cenário: Card de Saúde na Tela Operacional com filtro de Hoje
- **Given (Dado):** que o Gerente acessa `Relatorios.tsx` e filtra por "Hoje"
- **When (Quando):** o Batch Mode ainda não rodou e não há scores gerados
- **Then (Então):** o Card de "Score Global" deve exibir uma indicação de ausência de dados (`—`) com uma micro-legenda explicativa ("Aguardando processamento em lote") em vez de parecer um erro.
