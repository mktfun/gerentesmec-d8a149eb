# Research: Premium Aura Restoration & Dashboard Revert (013)

## 1. Contexto do Pedido
O usuário expressou descontentamento com as últimas atualizações visuais, indicando que a "aura premium" (Liquid Glass, UI Revolut, animações fluidas) foi perdida. Os principais pontos levantados foram:
1. **Dashboard:** O "card grandão" superior (que exibia o Score Global da Rede de forma impactante) foi removido na última iteração. Ele precisa voltar com destaque total.
2. **TV Mode:** Atualmente é apenas o dashboard expandido. O usuário pediu um layout diferenciado para a TV, com "3 cards muito grandões" (provavelmente focando nas 3 unidades ou nos 3 pilares do negócio), projetado especificamente para leitura à distância.
3. **CRM (Edição Facilitada):** O fluxo de editar os dados do Lead ou o Valor do Orçamento precisa ser muito mais rápido e integrado. O ideal é que o `AuditPanel` (Painel de Auditoria) tenha inputs inline para o orçamento, ou botões rápidos de edição no próprio Kanban.
4. **Relatórios (`/relatorios`):** A tela foi construída focando 100% no lado financeiro (Faturamento). Sendo um sistema de *Qualidade de Atendimento*, a ênfase primária deve ser na Saúde do Atendimento (SLAs rompido, Tempo de Espera, Evolução do Score), com o impacto financeiro como um complemento (ticket médio/orçamentos salvos).
5. **Estética Geral:** Retomar o uso intenso de sombras multicamadas coloridas (glows), bordas translúcidas (white/[0.06]), fundos super escuros (`#0a0a0f`) e micro-interações.

## 2. Análise Técnica e Resoluções

### 2.1 Reversão do Dashboard Hero
- **Antes:** Havia um painel largo com "Score Global da Rede: 78.5%" ocupando o topo, com indicadores das unidades ao lado.
- **Solução:** Restaurar e polir esse componente no topo de `Index.tsx`. As 4 mini-métricas criadas anteriormente podem ir para debaixo do gráfico ou serem integradas no card principal.

### 2.2 TV Mode Refatorado
- **Solução:** Quando `isTvMode` for true, o `Index.tsx` não renderiza os gráficos pequenos do Dashboard normal. Em vez disso, ele renderizará um componente dedicado `TvDashboard.tsx`, que terá uma grid com 3 colunas massivas (ex: uma coluna para cada Unidade, mostrando seu score atual, leads em risco e ticket médio na mesa).

### 2.3 CRM Edição Rápida
- **Solução:** No `AuditPanel.tsx`, adicionar um campo "Ticket do Orçamento" na mesma seção do Checklist, com edição inline (clica, digita, salva no blur). No `KanbanCard`, adicionar um atalho sutil para editar.

### 2.4 Relatórios (Health vs Finance)
- Substituir o foco "Faturamento Gerado" para "Score Médio de Qualidade".
- Trocar "Negócios Fechados" por "SLAs Atendidos" ou "Tempo Médio de Resposta".
- Os gráficos devem refletir auditorias, não apenas cifrões.
