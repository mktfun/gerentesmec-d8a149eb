# Tasks: Usuários Auditores e RBAC (Spec 060)

- [ ] Criar o componente `AuditorsPanel` em `src/components/Config/AuditorsPanel.tsx`
  - Utilizar o `VITE_SUPABASE_SERVICE_ROLE_KEY` para instanciar o Supabase Admin Client.
  - Criar funções para listar usuários que tenham `app_metadata.role === 'auditor'`.
  - Criar função para adicionar um novo usuário Auditor (`auth.admin.createUser`) setando a senha e `app_metadata`.
  - Criar função para editar a senha de um Auditor (`auth.admin.updateUserById`).
- [ ] Injetar o `AuditorsPanel` na tela principal de Configurações (`src/pages/Config.tsx`).
- [ ] Implementar a restrição de rotas em `src/App.tsx`.
  - Identificar o `isAuditor` através de `user?.app_metadata?.role === 'auditor'`.
  - Se for auditor, o layout inteiro será substituído por um roteamento direto para `<AuditoriaApp />` (como default) e `<AuditHistory />`.
  - Impedir carregamento do Sidebar Admin/Gerente para esse grupo de usuários.
