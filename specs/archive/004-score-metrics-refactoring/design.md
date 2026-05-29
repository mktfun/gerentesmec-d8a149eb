# Design: Score Metrics Refactoring

## Padrões Visuais (UX UI Architect 2026)
A tela de relatórios não possuía filtros adequados de status integrados para o score, nem a separação clara. Vamos seguir as diretrizes 2026:
- **Maximalismo Tátil**: Novos botões de filtro (`Ganhos`, `Perdidos`, `Todos`) na tela de Relatórios (`Relatorios.tsx`) em formato "Glass Pill" (micro interações). Ao invés de dropdowns tradicionais sem graça, usar componentes de Tabs ou Switchers bonitos.
- **Acessibilidade**: Contrastes adequados, os scores calculados que atingirem notas baixas (`< 50`) terão uma cor base `rose-500`, mas com acessibilidade WCAG garantida em contraste com o fundo escuro do card.

## Alterações de Código

1. **`src/utils/scoreUtils.ts`**:
   A função `avgScore` e `avgScoreInt` já implementam nativamente `options: ScoreFilterOptions` onde `onlyGanho` e `onlyCurrentMonth` são `true` por padrão. Isso significa que as telas do Dashboard **já estão operando dessa forma nativamente**, mas garantiremos que a exibição de scores individuais (ex: Kanban) não conte na média que o usuário vê (apenas informe a nota para o card).

2. **`src/pages/Relatorios.tsx`**:
   - Atualmente, as funções de relatório sobrescrevem os defaults: `avgScore(mLeads, { onlyCurrentMonth: false, onlyGanho: false })`.
   - Vamos adicionar um estado local `const [scoreStatusFilter, setScoreStatusFilter] = useState<'all' | 'ganho' | 'perdido'>('all')`
   - Atualizar a UI do Header para exibir este Toggle de estado.
   - O cálculo na tela de relatórios passará a respeitar esse estado interativamente.

3. **`src/components/Crm/KanbanCard.tsx` e `ChatHistoryView.tsx`**:
   - Nas listagens de histórico do lead, o usuário pode estar confuso. O score lá exibido reflete APENAS o atendimento dele. Para evitar confusão se ele não for um ganho (e portanto não estiver contabilizando na média do gerente), adicionaremos uma flag visual ao lado da nota do lead Perdido: `(Nota não computada na média geral da unidade)`.

## Impacto no Backend (Supabase MCP)
- Nenhuma alteração de Schema necessária. O banco de dados já possui `score` preenchido e as tabelas estão prontas. Todo o cálculo das médias já é dinâmico (client-side ou edge-side).
