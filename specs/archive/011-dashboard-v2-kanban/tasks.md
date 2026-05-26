# Tasks: Dashboard CEO v2 + Kanban + Bug Fixes + Config Screen (011)

## Fase 0: Bug Fixes Críticos
- [ ] Criar `src/context/ThemeContext.tsx` com ThemeProvider global
- [ ] Atualizar `src/App.tsx` para envolver tudo no ThemeProvider
- [ ] Atualizar `tailwind.config.ts` com tokens semânticos `app-bg`, `app-card`, `app-sidebar`
- [ ] Reescrever tokens CSS em `src/index.css` (light mode sem amarelo)
- [ ] Substituir todas as cores hardcoded no `DashboardLayout.tsx`, `Index.tsx`, `Crm.tsx`, `AuditPanel.tsx`
- [ ] Corrigir empty state do CRM (fundo marrom)

## Fase 1: Modelo de Dados Correto
- [ ] Atualizar `src/data/mockData.ts`:
  - 1 gerente por unidade (não vários)
  - Campo `funnel_stage` nos leads
  - Campo `chatwoot_inbox_name` nas unidades (= nome do canal no Chatwoot)
  - Dados de radar por etapa por unidade
  - Mais leads para preencher Kanban (8-12 leads)
  - Dados de histórico multiline por unidade

## Fase 2: Dashboard CEO v2
- [ ] Adicionar Bar Chart horizontal (score por unidade) em `Index.tsx`
- [ ] Adicionar RadarChart (4 etapas × 3 unidades) em `Index.tsx`
- [ ] Adicionar Card de Impacto Financeiro em `Index.tsx`
- [ ] Transformar chart simples em MultiLine chart (linha por unidade, 7 dias)
- [ ] Ajustar layout de grade para acomodar todos os novos gráficos

## Fase 3: Kanban CRM
- [ ] Adicionar campo `funnel_stage` no tipo Lead
- [ ] Criar `src/components/Crm/KanbanView.tsx` com 4 colunas
- [ ] Criar `src/components/Crm/KanbanCard.tsx` (card de conversa)
- [ ] Adicionar toggle Lista/Kanban e filtro por unidade em `Crm.tsx`
- [ ] Animação de transição entre vistas

## Fase 4: Tela de Configuração
- [ ] Adicionar rota `/config` em `App.tsx` e item na Sidebar
- [ ] Criar `src/pages/Config.tsx` com seções:
  - Seção "Integração Chatwoot" (API URL + Token)
  - Seção "Unidades e Mapeamento de Canais"
  - Seção "Gerentes" (1 por unidade, vinculado ao canal)
  - Seção "SLA" (configurar tempo em minutos)
- [ ] Criar `src/components/Config/UnitMappingCard.tsx`

## Fase 5: Build & Deploy
- [ ] `npm run build` sem erros
- [ ] `git commit` + `git push`
