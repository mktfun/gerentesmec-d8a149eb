# Tarefas: TV Operacional Rotativa

- [ ] 1. Instalar lib de gráficos se não houver (ex: `recharts` ou `chart.js` - confirmar o que já está instalado via package.json).
- [ ] 2. Criar componente `UnitOperationalSlide.tsx` com 2 seções: Gráfico Histórico de Score à Esquerda/Centro e Lista Minimalista de Leads em Alerta à Direita.
- [ ] 3. Criar componente `GlobalOperationalSlide.tsx` seguindo o mesmo padrão, mas exibindo a média da empresa e um ranking de gargalos.
- [ ] 4. Atualizar `TvOperacionalCarousel.tsx` para fazer o fetch de `daily_score_snapshots` (limit: 14 dias) usando Supabase Client.
- [ ] 5. Implementar a lógica de loop de carrossel no `TvOperacionalCarousel`, inserindo as Units como slides 1..N e o Global como Slide N+1.
- [ ] 6. Ajustar a renderização do número de telefone e nome na lista de alertas (sutil, sem poluição) usando o padrão `glassmorphism`.
- [ ] 7. Ajustar roteamento em `App.tsx` (se for substituir a TV Operacional atual, apenas alterar o componente na rota).
