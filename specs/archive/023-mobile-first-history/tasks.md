# Tasks: 023-mobile-first-history

## Fase 1: O Componente LumaBar
- [ ] 1. Criar o arquivo `src/components/Navigation/LumaBar.tsx`.
- [ ] 2. Implementar a lógica do LumaBar (baseado na referência do usuário) adaptada para roteamento do `react-router-dom` (usar `useLocation` para identificar o index ativo em vez de state puro).
- [ ] 3. Garantir que as importações do `framer-motion` e ícones do `lucide-react` estejam certas.

## Fase 2: Aplicando o LumaBar nos Layouts
- [ ] 1. Em `ManagerLayout.tsx`, substituir a navegação flutuante inferior estática pela importação e inserção do `<LumaBar />`. Modificar os arrays de rotas dentro do componente LumaBar para o gerente.
- [ ] 2. Em `DashboardLayout.tsx`, injetar o `<LumaBar />` mas forçar sua visibilidade apenas no mobile (`md:hidden`), enquanto a Sidebar atual permanece `hidden md:flex`. Ajustar os itens do LumaBar para o escopo do Administrador (Dashboard, CRM, Histórico, Configurações).

## Fase 3: A Página de Histórico (AuditHistory)
- [ ] 1. Criar `src/pages/AuditHistory.tsx`.
- [ ] 2. Criar a interface/tipagem para receber a junção de `audits` e `audit_answers`.
- [ ] 3. Fazer o Fetch dos dados usando o Supabase e salvar num estado local (`useEffect` ou `useQuery`).
- [ ] 4. Desenhar a visualização de Lista (Feed) dos relatórios, formatando as datas de maneira amigável (`date-fns`).
- [ ] 5. Criar o componente `AuditHistoryDetailDrawer.tsx` (utilizando shadcn `Drawer` ou Custom Motion Overlay) que aceita uma auditoria selecionada como prop.
- [ ] 6. Renderizar as `audit_answers` dentro do Drawer, usando `supabase.storage.from('audit_evidences').getPublicUrl()` para mostrar a miniatura.

## Fase 4: Integração Final e Polimento
- [ ] 1. Atualizar `src/App.tsx` injetando a rota `/historico-auditorias`.
- [ ] 2. Testar comportamento visual em telas responsivas via DevTools.
- [ ] 3. Comitar e fazer o push final `feat: mobile-first navigation and audit history`.
