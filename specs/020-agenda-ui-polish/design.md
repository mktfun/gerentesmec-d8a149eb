# SDD Phase 2: Design

## CSS Flexbox Bug
O overflow ocorre porque o container filho `.custom-scrollbar` na Screen 2 usa `max-h-[450px]` em vez das regras flexíveis nativas (min-h-0 + flex-1) dentro do grid flex-col. Substituiremos por um scrollbox nativo no flex-container para que ele nunca estoure o tamanho do `h-full` do container pai.

## Premium Typography
Atualizaremos as classes de título no componente das `Agenda Hoje` para:
- Títulos: `text-sm font-semibold text-white`
- Sub-textos: `text-[11px] text-[#8E8E93]`
- O padding dos cards será reduzido ou balanceado para ficar menor e elegante (p-3 flex gap-1.5).

## Data Logic
Em `useDashboardData.ts`, o `tickerEventos` mapeia `tickets.slice(0,10)`. Para evitar exibir fantasmas lá, vamos aplicar a heurística de remoção do "Protocolo Expirado fantasma" *diretamente* ao longo da lista, ou seja, onde quer que ele seja usado, ou aplicar o filtro no array de `tickets` logo após buscá-lo.
