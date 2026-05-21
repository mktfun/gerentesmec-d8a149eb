# Design: TV Mode Visuals & Metrics Engine

## Frontend (`src/components/Dashboard/TvDashboard.tsx`)

### Motor de Datas (Date Range State)
Teremos um estado `dateFilter` com as opções:
- `'today'`: Hoje
- `'yesterday'`: Ontem
- `'7d'`: Últimos 7 dias
- `'30d'`: Últimos 30 dias
- `'this_month'`: Mês Atual

Usaremos `localStorage.getItem('tv_date_filter')` no estado inicial para garantir persistência.
Uma função utilitária `filterLeadsByDate(leads, dateFilter)` fará a mágica de reter apenas os leads relevantes. O resto do componente usará `filteredLeads` para fazer a matemática.

### Cálculos de Métricas (`getUnitMetrics`)
- **T.M.R.**: Ao invés de hardcode, calcularemos `Math.round(filtered.reduce(wait_time_minutes) / filtered.length)`.
- **Leads em Risco**: Contaremos os leads do array `filtered` que possuem `sla_status === 'danger'`.

### Ajustes Visuais (Liquid Glass & CSS)
- O fundo cortando (clipping) geralmente acontece por causa de classes como `overflow-hidden` seguidas de `blur` absoluto gigante que passa dos limites. O blur deve estar `absolute -inset-x` mas sem clipping excessivo, ou o card não deve usar `overflow-hidden` rígido se o blur precisar vazar sutilmente.
- O Padding interno dos cards (`px-10 py-12` ou algo do tipo) precisa ser padronizado para suportar o círculo do gráfico em telas diferentes.
- A mensagem "Sem comparativo disponível" deve ter um posicionamento `absolute` ou ser parte de um container flex de tamanho fixo para não empurrar os elementos ao renderizar o `diff` (trend).

### UI do Filtro
Adicionar um `select` customizado ou menu suspenso elegante ao lado do relógio do cabeçalho.
