# Research: Dashboard v2 + Kanban CRM (011)

## Bugs Identificados nas Screenshots

### Bug 1: Light Mode amarelo
- O CSS do `DashboardLayout.tsx` usa classes hardcoded `bg-[#0d0d14]` para a sidebar e `bg-background/80` para o topbar.
- O topbar usa `bg-background/80` — quando o modo claro remove a classe `.dark`, a variável `--background` passa para `250 250 252` (muito claro) mas o topbar fica amarelo pois outros elementos têm cores estáticas dark hardcoded.
- **Causa raiz:** Cards e componentes usam cores hardcoded dark (`#111118`, `#0f0f18`, `#0d0d14`) que não respondem ao toggle de tema.
- **Fix:** Criar classes CSS semânticas que mudam com `dark:` e usar condicionais no código.

### Bug 2: Fundo marrom/estranho na área direita
- O CRM mostra um empty state com `bg-[#0d0d14]` que, junto ao fundo da página, cria um tom avermelhado/marrom indesejado.
- **Fix:** Unificar a cor de fundo para `bg-background`.

### Bug 3: Recarregamento de página ao navegar
- O `useDarkMode` hook está chamando `document.documentElement.classList` no `useEffect`, que roda no root do React. Quando a rota muda, o layout re-renderiza completamente mas o `useDarkMode` não está no contexto global (Context API), então cada mount recria o estado.
- **Fix:** Criar um `ThemeContext` que envolve o `App`, removendo o estado local do hook e garantindo um único state global.

### Bug 4: Navegação causa flash/reload
- O `DashboardLayout` re-renderiza parcialmente ao trocar de rota porque o `Outlet` não está envolto em um AnimatePresence com `key` correto.

## Mapeamento do Estado Atual (Arquivos)
- `src/App.tsx` — roteamento
- `src/hooks/useDarkMode.ts` — hook local (precisa virar Context)
- `src/components/Layout/DashboardLayout.tsx` — sidebar com cores hardcoded
- `src/pages/Index.tsx` — dashboard (falta: por unidade, impacto negativo, mais gráficos)
- `src/pages/Crm.tsx` — só lista (falta: kanban toggle)
- `src/data/mockData.ts` — precisa de mais dados para CEO analytics

## Análise do Dashboard CEO — O que um CEO quer ver

### Mentalidade do CEO (Daniel):
- **"Tô ganhando ou perdendo dinheiro por causa do atendimento?"**
- **"Qual mecânica tá prejudicando minha nota geral?"**
- **"O que exatamente tá errado em cada unidade?"**
- **"Quanto melhora se eu resolver o problema da unidade X?"**

### O que falta no Dashboard atual:
1. **Comparativo entre unidades** — não só ranking de gerentes, mas score de UNIDADE vs. UNIDADE
2. **O que está afetando o score** — qual etapa (Etapa 1? Etapa 3?) está sendo mais ignorada em cada unidade
3. **Tendência histórica por unidade** — unidade melhorando ou piorando?
4. **Impacto em reviews Google** — conexão entre score baixo e reviews (mock)
5. **SLA como indicador de perda de negócio** — quantos leads perdem a oportunidade por demora

## Análise do CRM Kanban — Como deve funcionar

### Funil de Atendimento (as 4 etapas = colunas do Kanban):
- **Coluna 1: Novo Lead** — chegou mas ainda não foi respondido
- **Coluna 2: Orçamento** — gerente respondeu, enviando proposta  
- **Coluna 3: Negociação** — cliente respondeu o orçamento, gerente em follow-up
- **Coluna 4: Encerrado** — fechado (aprovado ou perdido)

Cada card = uma conversa/lead específico.
Cada coluna pode ser filtrada por unidade (tabs no topo: Todos / Dom Pedro / Jabaquara / Kennedy).
Toggle entre Kanban e Lista existente.
