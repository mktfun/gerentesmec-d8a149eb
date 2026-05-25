# Requisitos: TV Operacional Rotativa

## Descrição
Criar uma visão de TV Operacional (`/tv/operacional-rotativa` ou substituir a atual) que funcione no formato de carrossel temporizado (similar ao `/tv/executivo`), mas com dados estritamente operacionais. O objetivo é dar "zoom" em uma unidade por vez, exibindo seus gerentes, tempos de fila e métricas de forma limpa, não poluída e altamente premium.

## User Stories
- **Como** operador da oficina, **eu quero** ver uma TV que rotacione automaticamente entre as unidades, **para que** eu tenha uma visão detalhada do operacional de cada filial sem precisar rolar a tela ou olhar uma grade poluída.
- **Como** gestor, **eu quero** ver os gerentes da unidade atual na tela, com foco no TMR (Tempo Médio de Resposta) atual de `lead_new` e na quantidade de leads por etapa, **para que** eu saiba exatamente quem está gargalando o fluxo.

## Critérios de Aceite
1. **Carrossel Automático:** A tela deve transicionar suavemente a cada X segundos (configurável: 15s, 30s, 60s).
2. **Visão por Unidade:** Cada slide deve exibir apenas 1 Unidade (ou no máximo 2, se houver espaço sem poluição), garantindo respiro visual e tipografia grande.
3. **Métricas Claras:** O cabeçalho da unidade deve mostrar o TMR Geral da Loja e Clientes em Espera.
4. **Cards de Gerentes:** Abaixo do cabeçalho, um grid limpo com os gerentes daquela unidade, mostrando seu TMR individual, Leads Novos em Espera, Leads em Negociação e Orçamento.
5. **Estética SDD:** Uso de vidro fosco (glassmorphism), cores sutis (texto principal branco/cinza, avisos em vermelho/rose elegante), bordas de 1px reflexivas, sem uso de cores gritantes ou formato "video game".
6. **Componente Reutilizável:** Deve utilizar ou estender a estrutura de paginação existente no `TvDashboard`.

## BDD Scenarios

### Cenário: Rotação Automática do Operacional
- **Given (Dado):** que existem 5 unidades cadastradas com gerentes.
- **When (Quando):** o usuário acessar a Rota de TV Operacional Rotativa.
- **Then (Então):** o sistema exibirá os dados operacionais da Unidade 1, aguardará 15 segundos, fará uma transição de fade suave e exibirá os dados da Unidade 2, repetindo o ciclo.

### Cenário: Exibição de Alertas dentro da Unidade
- **Given (Dado):** que a Unidade sendo exibida na tela possui um gerente (João) com TMR acima do SLA (20 minutos).
- **When (Quando):** o slide da unidade aparecer.
- **Then (Então):** o card do João deve possuir um glow/alerta sutil em tons de Rose/Red nas bordas, indicando estado crítico, enquanto os outros gerentes permanecem com a estética neutra premium.
