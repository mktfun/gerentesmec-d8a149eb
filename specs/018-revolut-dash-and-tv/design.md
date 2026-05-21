# Design: Revolut UI & TV Mode Pagination

## Estética "Revolut Bank"
O design baseia-se em:
- **Clean e Espaçoso**: Menos ruído, fontes maiores (Maximalismo Tátil).
- **Tipografia**: O peso da fonte importa muito. Números do score em `font-black`, labels secundários em `font-medium text-muted-foreground`.
- **Cantos Arredondados**: Uso de `rounded-2xl` e `rounded-[2rem]` em blocos principais.
- **Modo Claro / Escuro (Dinâmico)**: Trocaremos os fundos `bg-[#050508]` por classes baseadas em variáveis globais (ou o próprio Shadcn/Tailwind com `dark:` prefixos).
- **Microinterações e Transições**: `layoutId` do Framer Motion para transições fluidas. Tudo que muda de estado precisa ter transição (ex: hover, active, mudança de abas).

## Componentes a Serem Refatorados

### 1. `Index.tsx` (Dashboard Hero)
- O Hero do "Score Global" não terá mais os mini-cards ao lado em `flex-row` puro e infinito.
- Serão colocados em um contêiner `overflow-x-auto flex gap-4 snap-x hide-scrollbar`, permitindo deslizar horizontalmente (swipe no touch/trackpad) e não quebrando a tela. Estaremos adotando a tag `scroll-smooth` e `snap-mandatory`.

### 2. `Crm.tsx` (Topbar / Kanban Switcher)
- Substituir a lista horizontal contínua de unidades por um **Dropdown Customizado** (usaremos `Select` do Shadcn ou framer-motion drop menu).
- O Trigger do dropdown exibirá o nome da unidade e uma pílula com o Score atual da unidade (resolvendo o foco primário em Avaliação).
- O Dropdown (Lista) vai exibir a listagem completa.

### 3. `TvDashboard.tsx` (Comando Central / Modo TV)
- **Lógica de Paginação**:
  - Máximo de 3 `units` exibidos na tela por vez. Se temos 10 unidades, são 4 páginas.
  - Um `setInterval` que incrementa a `currentPage` baseada no tempo escolhido.
- **Controle de Tempo**:
  - Header ganhará três botões tipo pill: `15s`, `30s`, `60s`. O selecionado ganha destaque `bg-white/20`.
- **Animações de Troca**:
  - A troca de página usa o `<AnimatePresence mode="wait">` com uma saída em `opacity-0 scale-95` e entrada em `opacity-1 scale-100`. Super elegante e corporativo.
