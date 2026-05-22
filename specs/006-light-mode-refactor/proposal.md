# Proposal: 006-light-mode-refactor

## Requisitos
1. **Refatoração Completa do Tema (Light/Dark):** Toda a interface do sistema (Dashboard, CRM, Relatórios, Gerentes, Config) deve ser completamente funcional e agradável tanto no Modo Claro (Light) quanto no Modo Escuro (Dark).
2. **Eliminação de Cores Fixas:** Remover classes de Tailwind como `bg-[#0a0a0f]`, `text-white`, `border-white/10`, `text-white/40` e substitui-las por variáveis semânticas do projeto Shadcn UI (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`) ou pelo sufixo de tema (`bg-white dark:bg-[#0a0a0f]`).
3. **Manutenção do Liquid Glass 2026:** A readequação para o modo claro NÃO PODE remover a identidade premium (efeitos *Liquid Glass*, *Glows* e *Microinterações*). Os brilhos neon/holográficos devem ser ajustados para ficarem suaves contra fundos brancos (usando paletas de indigo/emerald dopamínicas).

## User Stories
- **Como Administrador**, quero poder alternar a chave para o "Modo Claro" na barra lateral e ver toda a aplicação adotar um fundo claro (branco/slate suave) de imediato.
- **Como Gerente em ambiente iluminado**, preciso ler as fontes e visualizar o funil do CRM com alto contraste, onde textos são nitidamente escuros contra o fundo claro, garantindo a acessibilidade visual WCAG 2.2.
- **Como Analista observando o painel Relatórios**, quero que a tabela de gerentes no modo claro mantenha listras legíveis (não pretas ou transparentes), e que os KPI Cards sejam legíveis em tons esmeralda/índigo sobre branco translúcido.

## BDD Scenarios

### Cenário: Toggling Global do Tema no Layout Principal
- **Given (Dado):** O sistema está carregado com o `isDark === false` (Modo Claro).
- **When (Quando):** O usuário visualizar o `DashboardLayout.tsx` e o container principal da aplicação.
- **Then (Então):** O plano de fundo da página principal não poderá ser preto `#0A0A0A`, mas sim o valor mapeado na variável CSS nativa da paleta clara (`var(--background)` que é um `slate-50`). Textos do Header devem ser escuros.

### Cenário: Renderização dos Cards do CRM (Light Mode)
- **Given (Dado):** O usuário entra na rota `/crm`.
- **When (Quando):** O modo claro estiver habilitado.
- **Then (Então):** Os cards dos Leads não devem sumir contra um fundo cinza, nem usar texto branco em fundo branco. Os cards devem apresentar a cor `bg-card` (branca) com borda suave cinza clara, e o texto deve utilizar `text-foreground` (quase preto).

### Cenário: Renderização do Dossiê e AuditPanel
- **Given (Dado):** O usuário clica em um Lead para expandir o formulário de Dossiê.
- **When (Quando):** O painel lateral se abre em ambiente iluminado.
- **Then (Então):** Os botões, áreas de rolagem e checklists devem usar `bg-white dark:bg-[#0a0a0f]` e garantir legibilidade perfeita sem ofuscar o operador.
