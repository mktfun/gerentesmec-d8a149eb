# Proposta: Reestruturação Dinâmica dos Dashboards de TV (Feature 003)

## 1. Requisitos
1. **Live Chart Tracking:** Garantir que o gráfico histórico de qualquer dashboard some os dados da noite anterior ao dia de hoje em tempo real ("hoje").
2. **Nova Posição de Score:** Centralizar a nota de pontuação global da Unidade na visão de TV Operacional, repousando entre o nome da Unidade (à esquerda) e os Cards Numéricos de Fila/Atraso (à direita).
3. **Sequência Intercalada:** Alterar a lógica do carrossel da TV Operacional para o fluxo `Unidade > Global > Unidade > Global`, substituindo a exibição sequencial massiva seguida de um único macro global no final.
4. **Visão Executiva Expandida:** Incluir na primeira tela da TV do Executivo (Macro View) o gráfico de Evolução Histórica dos últimos 7 a 14 dias consolidados da rede inteira.
5. **Correção UI (Liquid Glass Overflow):** Remover o defeito visual da luz/neon sendo "cortada" por uma caixa quadrada no círculo do Score Geral.

## 2. User Stories
- **Como gerente da unidade**, eu quero que o painel mostre a minha evolução histórica refletindo as mensagens enviadas hoje, e não que acabe ontem, **para que** minha equipe se sinta motivada em tempo real com as avaliações feitas nos últimos 5 minutos.
- **Como executivo assistindo à TV da sala**, eu quero ver o gráfico evolutivo da rede inteira logo na primeira tela do painel e não quero ver gráficos borrados ou cortados com quadrados ("luzes quadradas").
- **Como colaborador acompanhando a TV Operacional**, eu quero que o placar da oficina intercale sempre o resumo da minha loja com o panorama de todo o grupo (geral), **para que** não perca o contato com o panorama global enquanto aguardo o ciclo do carrossel virar 10 unidades.

## 3. BDD Scenarios

### Cenário: Geração do Gráfico Evolutivo de Unidade/Global
- **Given (Dado):** O lead foi auditado há 5 minutos recebendo 100%. O banco só salva o log noturno no fim do dia (que é o `daily_score_snapshots`).
- **When (Quando):** A TV Operacional ou Executiva carregar o gráfico AreaChart.
- **Then (Então):** A inteligência front-end deve anexar um data point virtual "Hoje" calculando a média real no presente usando o helper `avgScoreInt`, garantindo que a curva termine apontando a tendência exata e atual do dia corrente.

### Cenário: Exibição Correta do Círculo com Neon
- **Given (Dado):** O círculo SVG da visão do Score Executivo está renderizando com `viewBox="0 0 256 256"`.
- **When (Quando):** O componente recebe um `drop-shadow-[0_0_20px...]`.
- **Then (Então):** A classe do SVG deve ser alterada de `<svg className="...">` para possuir `overflow-visible`, liberando o motor gráfico do navegador para desenhar o neon com gradiente natural fora dos 256 pixels matemáticos e sanando o defeito visual "quadrado".
