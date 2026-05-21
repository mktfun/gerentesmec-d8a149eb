# Tasks: Fallbacks, Chatwoot Link e Chart Fix

- [ ] 1. **Helper Utils de TMR e Metrics**
  - Criar `src/utils/metrics.ts` contendo a função robusta `calculateTmr` (com fallback) para ser compartilhada em toda a aplicação.
- [ ] 2. **Refatoração dos Componentes p/ o Helper**
  - Refatorar `Index.tsx`, `TvDashboard.tsx` e `Relatorios.tsx` para usarem o novo helper unificado, resolvendo os problemas de dados "zerados" do legado.
- [ ] 3. **Correção do Gráfico Global (Index)**
  - Mudar o cálculo de `globalScore` e dos pontos do `weekData` para ser a soma aritmética ponderada (sum scores / count leads).
  - Tratar o estado "Vazio / 1 Ponto" do Recharts (se só houver 1 dia no array, formatar corretamente para não quebrar a visualização, quem sabe duplicando o ponto ou tratando o label).
- [ ] 4. **Botão Chatwoot no CRM**
  - Abrir `src/components/Crm/AuditPanel.tsx`.
  - Pegar o ID da conversa e a URL via AppDataContext.
  - Injetar o Link `<a>` discreto com ícone de `MessageSquare` abrindo em `_blank`.
