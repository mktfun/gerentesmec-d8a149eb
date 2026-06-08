# Design: 023-mobile-first-history

## UX/UI Architect 2026 Guidelines

### 1. O Componente LumaBar (Navegação Inferior)
- Seguiremos a exata referência de código do usuário, incorporando o componente `LumaBar.tsx` na pasta `components/Layout/`.
- **Efeitos aplicados:**
  - `backdrop-blur-2xl` no container principal.
  - O "Active Indicator Glow" usa `<motion.div layoutId="glow" />` para transitar magicamente entre os ícones.
  - Será usado tanto no `DashboardLayout` (exibido apenas via `md:hidden`) quanto no `ManagerLayout` (onde será o menu primário independente do tamanho da tela).

### 2. A Página de Histórico (AuditHistory)
- **Estrutura da Lista:** Feed vertical. Cards estilo vidro fosco (`bg-card/50 backdrop-blur`). Cada card mostra a data (destaque em tipografia bold), unidade e score formatado com cor condicional (verde para >80%, amarelo >60%, vermelho <60%).
- **Visualização do Detalhe:**
  - Em telas mobile, usaremos um `Drawer` (shadcn) puxando de baixo para cima com efeito elástico.
  - Dentro do Drawer, um cabeçalho com a Nota Global, seguido de uma ScrollArea vertical contendo a lista das respostas.
  - Para as fotos (`audit_evidences`), exibiremos thumbnails com `aspect-square`, `object-cover` e bordas levemente arredondadas (`rounded-xl`).
  - Cada resposta de checklist terá um Badge minimalista estilizado (Solid Green/Red dependendo da conformidade).

## Arquitetura e Supabase
- **Queries:** Utilizaremos joins ou duas requisições separadas (primeiro busca `audits`, depois as `audit_answers` da auditoria selecionada).
- **Storage URLs:** O Helper `supabase.storage.from('audit_evidences').getPublicUrl(path)` será utilizado em tempo real para exibir as fotos no front-end, garantindo URLs frescas sem hardcode no DB.
