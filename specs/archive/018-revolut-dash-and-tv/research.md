# Research: Redesign Revolut Bank & Escala de Unidades

## Contexto e Problema
O sistema foi desenhado inicialmente para 2 ou 3 unidades. Quando o usuário adicionou várias unidades, o layout quebrou em três pontos cruciais:
1. **Dashboard (`Index.tsx`)**: A fileira horizontal de scores das unidades aperta e quebra o layout.
2. **CRM/Kanban (`Crm.tsx`)**: As abas superiores (Tabs) para filtrar unidades extrapolam o limite da tela.
3. **Modo TV (`TvDashboard.tsx`)**: O grid `grid-cols-3` não comporta mais de 6 unidades sem "espremer" os cards ou causar scroll indesejado.

## Requisitos do Usuário
- **Escalabilidade Visual**: Adaptar a UI para suportar N unidades de forma elegante.
- **Kanban Switcher**: Uma nova lógica para alternar entre os funis de cada unidade no Kanban, focando em "Score e Avaliação".
- **Modo TV Rotativo**: Dividir o Modo TV em "páginas" que passam automaticamente com transições fluidas. Adicionar controle de tempo (15s, 30s, 1min) próximo ao botão de sair.
- **Design "Revolut Bank"**: Transições perfeitamente fluidas, design premium, elementos interativos não-estáticos. Suporte a Light Mode e Dark Mode. Liquid Glass, sombras curadas, microinterações constantes.

## Benchmarking & Solução (Revolut UI / UX 2026)
- **Dashboard**: Em vez de alinhar os scores horizontalmente no Hero, transformá-los em um **Carousel / Slider Horizontal** (framer-motion drag) ou um grid em bloco separado com scroll nativo oculto (`overflow-x-auto snap-x`).
- **Kanban Switcher**: Substituir a linha infinita de botões por um **Switcher Vertical ou Dropdown Premium de Seleção Rápida**, onde cada item da lista já mostra o "Score Atual" e "Alerta SLA" da unidade.
- **Modo TV**: Usar paginação infinita (`AnimatePresence` do framer-motion) que troca a cada X segundos. Mostrar até 3 ou 4 unidades por página em proporções áureas, mantendo o "Foco do Dia" no topo.
