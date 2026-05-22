# Design: 006-light-mode-refactor

## 1. Mapeamento de Classes e Substituições (Find & Replace Estratégico)
A estratégia será usar as variáveis mapeadas no `src/index.css`.
As seguintes substituições padronizadas devem ser feitas ao longo dos componentes React/Tailwind:

### Backgrounds
- `bg-[#0A0A0A]` ou `bg-[#0a0a0f]` -> `bg-background`
- Containers internos, Cards, Tables `bg-[#0a0a0f]` -> `bg-card`
- Painéis destacados `bg-[#12121a]` -> `bg-white dark:bg-[#12121a]` ou `bg-muted`
- `bg-white/[0.04]`, `bg-white/5` -> `bg-black/5 dark:bg-white/5` (Isso inverte a opacidade suave de branco para o modo escuro, para preto translúcido no modo claro).

### Tipografia
- `text-white` -> `text-foreground` (Exceto botões sólidos ou labels coloridas específicas)
- `text-white/40`, `text-white/60`, `text-white/80` -> `text-muted-foreground` (Ou usar Tailwind opacities literais como `text-slate-500 dark:text-white/60`)

### Bordas (Dividers, Borders, Table Rows)
- `border-white/5`, `border-white/10`, `border-white/[0.08]` -> `border-border` ou `border-black/10 dark:border-white/10`.

## 2. Abstração do "Apple Liquid Glass" para Modo Claro
Para manter a aparência **Apple Liquid Glass 2026** de UI sem quebrar o contraste em modo claro:
- Efeitos Blur (`backdrop-blur-xl`) devem permanecer.
- No modo dark, o Liquid Glass usa fundos ultra-escuros com bordas subexpostas: `bg-white/[0.01] border-white/[0.04]`.
- No modo light, o Liquid Glass usa fundos brancos translúcidos e bordas clarinhas: `bg-black/[0.02] dark:bg-white/[0.01] border-black/5 dark:border-white/[0.04]`.

## 3. Revisão Específica por Arquivo Principal
1. **`DashboardLayout.tsx`:** Remover a injeção estática de `bg-[#0A0A0A]`. O `bg-background` já está na tag body ou no container externo de TV Mode. O header também não pode ser preto forçado.
2. **`Relatorios.tsx`:** Modificar os KPI Cards (`bg-[#0a0a0f]`) para `bg-card`. Consertar tabelas de gerentes (`divide-white/[0.04]`).
3. **`Crm.tsx` & `AuditPanel.tsx`:** Onde ocorre renderização de Dossiês e Chat, as bolhas de chat precisam usar cores neutras (`bg-muted` vs `bg-primary`) que sobrevivam à iluminação da tela.
4. **`Dashboard.tsx / Index.tsx`:** Cards da TV e métricas globais.

Não faremos migrações SQL nem mudanças de backend, pois o bug é inteiramente de folha de estilo (CSS/Tailwind).
