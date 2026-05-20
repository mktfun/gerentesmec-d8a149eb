# Tasks: Redesign Visual Revolut-Inspired (010)

## Fase 0: Sistema de Design Global
- [ ] Adicionar import da fonte `Plus Jakarta Sans` no `index.html`
- [ ] Reescrever `src/index.css` com CSS variables completo para Dark/Light mode e glassmorphism utilities
- [ ] Adicionar classe `dark` no `html` por padrão e lógica de toggle via `localStorage`
- [ ] Criar `src/hooks/useDarkMode.ts` para persistir preferência

## Fase 1: Sidebar & Layout Premium
- [ ] Reescrever `DashboardLayout.tsx` com nova sidebar premium
  - Fundo `#0d0d14`, bordas sutis, itens com hover glass
  - Item ativo com borda indigo esquerda
  - Toggle Dark/Light no rodapé
  - Rota `/gerentes` funcionando no menu
- [ ] Atualizar `App.tsx` adicionando a rota `/gerentes`

## Fase 2: Dashboard Executivo (Hero + KPIs + Chart + Ranking)
- [ ] Reescrever `src/pages/Index.tsx` completo:
  - Zone 1: Hero card com score `78.5%` gigante (count-up animation) + chips de unidade
  - Zone 2: Row de 3 KPI cards glass (Atendimentos, Pendentes, Alerta)
  - Zone 3 esquerda: Gráfico AreaChart estilo Revolut (linha branca, fundo minimal)
  - Zone 3 direita: Ranking premium com `▲▼` por gerente

## Fase 3: CRM / Auditoria (Agrupamento Visual por Status)
- [ ] Reescrever `src/pages/Crm.tsx`:
  - Agrupar leads por status na lista (SLA / Em Andamento / Concluídos)
  - Cada seção com cabeçalho colorido e count badge
  - Cards com borda esquerda colorida por urgência
  - Seção "Concluídos" colapsável
- [ ] Atualizar `src/components/Crm/AuditPanel.tsx` com visual dark/glass

## Fase 4: Página Gerentes & Unidades (Nova)
- [ ] Criar `src/pages/Gerentes.tsx`:
  - Grid de cards de unidade com score gigante e lista de gerentes
  - Animação stagger nos cards
- [ ] Criar `src/components/Gerentes/ManagerModal.tsx`:
  - Sheet/modal com histórico de auditoria do gerente
  - Mini gráfico de linha de evolução pessoal

## Fase 5: Polimento e Build
- [ ] Verificar todas as transições de spring entre rotas
- [ ] Testar toggle Dark/Light em todas as telas
- [ ] `npm run build` sem erros
- [ ] `git commit` e `git push`
