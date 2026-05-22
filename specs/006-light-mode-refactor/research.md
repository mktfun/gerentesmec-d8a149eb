# Research: 006-light-mode-refactor

## Contexto do Problema
O usuário reportou que o "Modo Light" está totalmente quebrado. Pelas imagens enviadas e após uma análise nos arquivos fonte (`DashboardLayout.tsx`, `Relatorios.tsx`, `Crm.tsx`, etc.), confirmamos o diagnóstico.

### Causas Raiz
1. **Hardcoding de Cores Escuras:**
   - O projeto está infestado com classes utilitárias literais do Tailwind, como: `bg-[#0a0a0f]`, `text-white`, `border-white/10`, `bg-[#12121a]`.
   - Estas classes forçam a interface a ficar escura independentemente do tema ativo (`isDark` flag gerida pelo `ThemeContext`).
2. **Ignorando CSS Variables Nativas:**
   - O arquivo `src/index.css` já possui o ecossistema perfeito do Shadcn UI mapeado (`--background`, `--foreground`, `--card`, `--border`).
   - Porém, quase todos os componentes complexos não utilizam essas variáveis nativas (`bg-background`, `bg-card`, `text-foreground`).
3. **Contraste de Fundo (Bleeding):**
   - No `DashboardLayout.tsx`, o container principal define `bg-[#0A0A0A]`, matando instantaneamente o Light Mode para todas as rotas (que herdam este background preto translúcido).
   - Sidebar e headers também misturam `bg-sidebar` (que reage ao tema) com `border-white/5` (que quebra no modo claro).

## Arquivos Afetados Mapeados
A busca retornou inúmeros arquivos. Os principais suspeitos que necessitam de refatoração massiva:
- `src/components/Layout/DashboardLayout.tsx`
- `src/pages/Index.tsx` (Dashboard principal)
- `src/pages/Relatorios.tsx`
- `src/pages/Crm.tsx` e submódulos (`AuditPanel.tsx`, `ChatHistoryView.tsx`)
- `src/pages/Gerentes.tsx`
- `src/pages/Config.tsx`

## Abordagem Recomendada
- Substituir hardcoded strings por semânticas do Tailwind.
- Onde for impossível ou indesejável usar variável semântica (por exemplo, um efeito vítreo muito específico), usar a anotação `dark:` do Tailwind (ex: `bg-white dark:bg-[#0a0a0f]`, `text-slate-900 dark:text-white`).
