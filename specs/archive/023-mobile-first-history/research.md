# Research: 023-mobile-first-history

## Contexto Atual
- **Layouts Existentes:** O projeto possui o `DashboardLayout.tsx` (que utiliza uma Sidebar padrão fixa, oculta em mobile) e o `ManagerLayout.tsx` (que possui uma barra flutuante muito simples, sem labels).
- **Problema:** A Sidebar do Dashboard desaparece no mobile, impossibilitando a navegação. Além disso, não há uma tela de visualização (Audit History) para visualizar relatórios passados salvos nas tabelas `audits` e `audit_answers`.
- **Preferência do Usuário:** Em vez de um menu hambúrguer responsivo tradicional ou `Sheet`, o usuário prefere uma "Floating Bottom Nav" (LumaBar) com efeito Glassmorphism avançado e indicador brilhante animado (`framer-motion`), enviando inclusive um código de referência com um "Active Indicator Glow" espetacular.

## Dados e Supabase
- As tabelas de `audits` (ID, unidade, auditor, score, status, data) e `audit_answers` (resposta, comentário, foto URL) já estão configuradas.
- Precisaremos implementar a recuperação das URLs públicas do Supabase Storage `audit_evidences`.

## Referências Visuais
- A UI deve seguir rigorosamente a skill `ux-ui-architect-2026` (Maximalismo Tátil, Apple Liquid Glass).
- O LumaBar sugerido utiliza classes utilitárias do Tailwind como `backdrop-blur-2xl`, `bg-white/20`, transições de mola do `framer-motion` e um gradiente brilhante atrás do item ativo.
