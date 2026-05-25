# Requisitos: TV Operacional Rotativa (Foco em Unidade e Empresa)

## Descrição
Criar uma visão de TV Operacional (`/tv/operacional-rotativa`) que rotaciona os slides exibindo o raio-x completo de **uma unidade por vez**, e ao final do loop exibe uma visão **Geral da Empresa**. O design deve ser extremamente refinado (estética Daniel / SDD 2026), com gráficos de histórico diário e listas elegantes de alertas reais.

## User Stories
- **Como** operador/dono, **eu quero** ver a TV passar unidade por unidade, **para que** eu veja o histórico de pontuação dela (gráfico), o TMR atual e a lista de leads estourados (nome e número), sem precisar poluir a tela com dados de outras filiais.
- **Como** gestor, **eu quero** que após passar por todas as unidades, a TV mostre um painel Geral da Empresa, **para que** eu tenha o panorama do dia e saiba o que precisa da minha atenção máxima (alertas globais).

## Critérios de Aceite
1. **Loop do Carrossel:** A tela deve exibir `Unidade 1 -> Unidade 2 -> ... -> Unidade N -> Visão Geral Empresa`, repetindo.
2. **Slide da Unidade:**
   - Gráfico de linha/barra do histórico de Score por dia daquela unidade (usando `daily_score_snapshots`).
   - TMR atual da unidade (já filtrado pelo gerente único da loja).
   - Lista minimalista e elegante de **Leads em Alerta** contendo Nome, Telefone e tempo de atraso/etapa.
3. **Slide Visão Geral Empresa:**
   - Gráfico histórico do Score Global.
   - TMR Médio Global e total de leads ativos.
   - Lista consolidada das "lojas em alerta" ou piores gargalos.
4. **Estética SDD:**
   - Visual premium dark mode, sem cores carnavalescas.
   - Uso de cards glassmorphism sutis.
   - Listas de leads não devem poluir a tela: devem mostrar os Top 5 ou Top 7 mais críticos e omitir o resto para manter o respiro visual.

## BDD Scenarios

### Cenário: Renderização do Histórico e Alertas da Unidade
- **Given (Dado):** que a TV está exibindo o slide da filial "Carijós".
- **When (Quando):** a página carrega os dados.
- **Then (Então):** deve renderizar um mini-gráfico com as notas dos últimos 7-14 dias extraídas da coluna `unit_breakdown`, além de renderizar uma lista (nome e telefone formatado) dos leads que estão com SLA estourado (Danger).

### Cenário: Transição para a Visão Global
- **Given (Dado):** que a TV terminou de exibir a última unidade da lista.
- **When (Quando):** o timer de 15 segundos estourar.
- **Then (Então):** a TV deve transicionar para o Slide Geral, exibindo a média de TMR de toda a empresa e o gráfico de score `global_score` dos últimos dias.
