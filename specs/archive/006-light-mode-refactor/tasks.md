# Tasks: 006-light-mode-refactor

## 1. Refatoração Base e Layout
- [ ] Editar `src/components/Layout/DashboardLayout.tsx`:
  - Remover `bg-[#0A0A0A]`, mantendo o `bg-background`.
  - Atualizar o Header principal: trocar fundos pretos absolutos para fundos que absorvam `bg-background` / `bg-card` e borders para `border-border`.
  - Corrigir a cor da tipografia "Olá Administrador" de `text-white` para `text-foreground`.

## 2. Refatoração da Dashboard (Index)
- [ ] Editar `src/pages/Index.tsx`:
  - Corrigir KPI Cards: trocar `bg-[#0a0a0f]` e `border-white/[0.08]` para `bg-card`, `border-border`.
  - Trocar `text-white` por `text-foreground` / `text-card-foreground`.
- [ ] Editar `src/components/Dashboard/TvDashboard.tsx` (Mesmo passo, mas apenas garantir que a versão TV também respeita a paleta primária).

## 3. Refatoração do CRM e Módulos de Chat
- [ ] Editar `src/pages/Crm.tsx`:
  - Limpar colunas (Novo Lead, Em Orçamento) de fundos forçados escuros, usar classes dinâmicas.
- [ ] Editar `src/components/Crm/AuditPanel.tsx`:
  - Corrigir inputs auto-preenchidos, selects, e headers (remover hardcoded whites).
- [ ] Editar `src/components/Crm/ChatHistoryView.tsx`:
  - Garantir que as bolhas de chat não brancos e bot usem paleta neutra e contrastante, independente do modo de cor. O painel não pode ter o background negro forçado (`bg-[#0a0a10]`).

## 4. Refatoração de Analytics, Configs e Gerentes
- [ ] Editar `src/pages/Relatorios.tsx`:
  - Remover hardcoded colors das tabelas e Selects criados na Spec 005. Adaptar tabela listrada para usar o `border-border` e `divide-border`.
- [ ] Editar `src/pages/Gerentes.tsx`:
  - Corrigir os cards dos gerentes. Tipografia e barras de progresso devem ficar nítidas em fundo claro.
- [ ] Editar `src/pages/Config.tsx`:
  - Adaptar textboxes de webhook e labels da interface de configuração.
- [ ] Editar Modais (`LeadModalForm.tsx` e `ManagerModalForm.tsx`) para usar `bg-background` ao invés de `bg-[#0a0a0f]`.

## 5. Quality Gate
- [ ] Verificar navegação entre as telas ativando e desativando o Modo Claro, validando constraste e preservando a profundidade do Apple Liquid Glass e Maximalismo Dopamínico.
