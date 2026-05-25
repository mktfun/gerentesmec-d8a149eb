# Tarefas - Rework Total TVs

- [ ] **Passo 1 (Refatoração TV Executivo - Resgate do TvDashboard.tsx):**
  - Abrir `src/components/Dashboard/TvDashboard.tsx` e injetar a "Página 0" (Macro View). A Página 0 será mostrada quando `page === 0` e terá o placar Score Global e Top 3 Gerentes (copiado da lógica atual de `TvExecutivo.tsx`).
  - As páginas `page > 0` exibirão as unidades (cards com SVG de percentual), como já estava feito no `TvDashboard.tsx`.
  - Renomear o import no `App.tsx` para que a rota `/tv/executivo` aponte para `src/components/Dashboard/TvDashboard.tsx`. (O `src/pages/tv/TvExecutivo.tsx` pode ser deletado).
- [ ] **Passo 2 (Refatoração TV Operacional):**
  - Abrir `src/pages/tv/TvOperacional.tsx`.
  - Reescrever o layout com 3 colunas:
    - Fila de Espera (`lead_new`), ordenada por data. Sem limite drástico. Com glow vermelho elegante nos itens atrasados.
    - Coluna Central (Ação): KPIs gerais da oficina (TMR, Qtd. Críticos).
    - Coluna Direita (Raio X): Quantos estão em `negotiation` e `quote` separados.
- [ ] **Passo 3 (Verificação Final):**
  - Testar builds e UI.
