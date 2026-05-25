# Tarefas de Implementação

- [ ] **Passo 1:** No arquivo `src/pages/Relatorios.tsx`, criar a função local `isTrue = (v: any) => v === true || v === 'true';`.
- [ ] **Passo 2:** Substituir as somas condicionais das etapas E1, E2, E3 e E4 (linhas ~160 a 175) para utilizar `isTrue(checklist['1a']) ? 1 : 0`.
- [ ] **Passo 3:** Na mesma página, declarar um state `currentPage` começando em 1.
- [ ] **Passo 4:** Na lista `auditedLeads`, fatiar a exibição da tabela usando `auditedLeads.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)`.
- [ ] **Passo 5:** Renderizar os controles de paginação (Anterior, Próxima) com os ícones `ChevronLeft` e `ChevronRight` (adicioná-los ao import da lucide-react).
- [ ] **Passo 6:** Verificar responsividade dos botões e do scroll.
