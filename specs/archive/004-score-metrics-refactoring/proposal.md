# Proposal: Score Metrics Refactoring

## 1. Requisitos
- **Geral**: As pontuações (Scores) de qualidade de atendimento devem ser exibidas em Dashboards refletindo APENAS leads que possuam score registrado, estejam no funil com o status "Ganho" e cuja data pertença ao mês vigente.
- **Relatórios**: A tela de Relatórios (`/relatorios`) deve exibir todas as métricas de forma consolidada, porém permitindo ao usuário filtrar por Mês/Período, Status (Ganho/Perdido) etc., mudando a contabilização dinamicamente.
- **Regra de Exceção Analítica**: Uma decisão de negócio importante precisará ser alinhada: Se os leads "Perdidos" não contarem no score do gerente, atendimentos péssimos não prejudicarão a média. O sistema deve garantir que haja clareza nessa decisão, podendo exibir o "Score Geral" e o "Score de Ganhos" de forma separada no futuro.

## 2. User Stories
- **US1**: Como dono da rede, eu quero que a média de pontuação das minhas unidades e gerentes reflita apenas negócios Ganhos no mês corrente nas visões diárias, para focar na equipe que está convertendo vendas.
- **US2**: Como gerente de CRM, eu quero acessar a tela de Relatórios e ver os dados consolidados do mês atual e anterior (Ganhos e Perdidos), com filtros para isolar a nota dos "Perdidos", para eu entender por que perdi essas vendas.

## 3. Critérios de Aceite
- [ ] As funções de média de score nos componentes `Index.tsx`, `TvDashboard.tsx` e `Gerentes.tsx` usam Mês Vigente e Apenas Ganho (o que já é o default, mas deverá ficar explícito visualmente no card).
- [ ] A tela de `Relatorios.tsx` possui um novo filtro no header: `[Todos os Status] | [Apenas Ganhos] | [Apenas Perdidos]` para que o score mude na hora de acordo com a escolha.
- [ ] O cálculo atual já exclui (ignora) os leads cujo score é `null`. A matemática da divisão do score deve ser explicitamente clara para o usuário em tooltips.

## 4. BDD Scenarios

### Cenário: Exibição no Dashboard Principal
- **Given (Dado):** que o gerente João tem 3 leads. O chassi A foi Ganho em Maio (Score: 100), o B foi Perdido em Maio (Score: 50) e o C foi Ganho em Abril (Score: 80). Estamos em Maio.
- **When (Quando):** visualizamos a pontuação do João na tela inicial e no TV Dashboard.
- **Then (Então):** o score médio deve ser 100% (apenas o chassi A conta, pois B foi Perdido e C foi no mês passado).

### Cenário: Filtro Interativo na Tela de Relatórios
- **Given (Dado):** que o usuário está na tela de Relatórios observando os resultados de Maio.
- **When (Quando):** ele escolhe o filtro de status "Todos os Status" e "Mês Vigente".
- **Then (Então):** o score médio do João deve ser 75% (Média entre 100 e 50, ignorando o de Abril).
- **When (Quando):** ele muda o filtro para "Perdidos".
- **Then (Então):** o score médio de João deve cair para 50%.
