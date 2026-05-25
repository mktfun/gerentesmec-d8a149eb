# Tarefas: TV Operacional Rotativa

- [ ] 1. Criar componente auxiliar `ManagerOperationalCard.tsx` com design premium, recebendo o gerente e seus leads para cálculo de TMR isolado e badges.
- [ ] 2. Criar componente `UnitOperationalSlide.tsx` que agrupa o cabeçalho e os gerentes daquela unidade em um grid (com `framer-motion` para entrada suave se necessário).
- [ ] 3. Criar ou refatorar a view principal `TvOperacionalCarousel.tsx` (substituindo o TvOperacional fixo ou criando nova rota, confirmar no código). 
- [ ] 4. Implementar a lógica de agrupamento de unidades no Contexto dentro do `TvOperacionalCarousel`, filtrando apenas unidades que possuem gerentes e leads.
- [ ] 5. Implementar o hook de intervalo (`useInterval` ou `setInterval` com `useEffect`) para rotacionar o `currentIndex` das unidades a cada 15 segundos (com controle de play/pause no header).
- [ ] 6. Ajustar roteamento em `App.tsx` (caso seja substituído o `/tv/operacional`, apenas importar o novo componente).
- [ ] 7. Validar cálculos de TMR utilizando a função corrigida `calculateTmr` do `metrics.ts` garantindo que o alerta de danger dispare corretamente.
- [ ] 8. Testar exibição full-screen simulando um ambiente de TV.
