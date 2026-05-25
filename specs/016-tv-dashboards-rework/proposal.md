# Rework Total dos Dashboards de TV

## Contexto e Lacunas Identificadas
A TV Operacional anterior era apenas uma lista de alertas cegos, sem contexto de "para onde olhar primeiro" e "qual é o cenário atual da oficina". A TV Executiva havia perdido o charme premium do "TvDashboard" antigo (com carrossel a cada 15s, filtros de topo e design Liquid Glass de alto nível).

## Requisitos

### 1. TV Operacional (Radar Tático)
- Deve exibir o funil atual em tempo real (Total em Novo Lead, Em Negociação e Orçamento).
- Deve exibir uma "Fila de Atendimento Crítica" detalhada: Lista dos leads da Etapa 1 aguardando contato, do mais antigo para o mais recente, com TMR individual e nome da unidade, para cobrança cirúrgica.
- O alerta será elegante (glow vermelho pulsante ao redor do card atrasado) sem piscar a tela inteira.

### 2. TV Executiva (Visão do CEO)
- Resgatar o antigo `TvDashboard.tsx` completo (com topo escuro, botões de timer 15s/30s/60s, e filtros de Data).
- Adicionar uma **Página 0** no carrossel: A "Visão Macro Nacional" mostrando o Score Global e o Ranking Top 3. As páginas 1 em diante voltam a exibir os cards com círculos e métricas por Unidade (como era antes).
