# Spec Plan

- [ ] Editar `src/hooks/useDashboardData.ts`
  - Criar uma versão filtrada globalmente de `tickets` onde ignoramos fantasmas (Protocolo Expirado hoje s/ mensagem).
  - Usar essa lista limpa para gerar `tickerEventos`.
- [ ] Editar `src/components/dashboard/Screens.tsx`
  - Substituir `max-h-[450px]` no scrollbox de Agenda Hoje por `flex-1 min-h-0 overflow-y-auto`.
  - Refinar a UI dos cards reduzindo tamanho de fontes e deixando o design mais conciso e sofisticado.
