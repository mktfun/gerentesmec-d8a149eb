# Design: Audit Inspector Modernizado (Feature 005)

## 1. Princípios Visuais da UI
- **Consistência de Tema**: O componente herdará a variável `isDark` do `ThemeContext`. Se Light, fundo geral será `#f5f6f7` (ou branco). Se Dark, será `#212529`.
- **Minimalismo de Cores**: Os glows e bordas translúcidas de neon (ex: `boxShadow: '0 0 20px rgba(99,102,241,0.15)'`) serão retiradas. Usar Drop-Shadows reais e opacas para elevar elementos no fundo.
- **Tipografia**: `font-instrument` global, aplicando `font-black` ou `font-bold` em identificadores de falha/checklist, aumentando legibilidade.

## 2. Topologia de Componentes

### A. Modal Header
- Substituir o header complexo de vidro escuro por uma barra sólida e limpa aderente ao tema.
- Trocar o ícone do avatar e do score para designs de alto preenchimento sólido sem transparência fina.
- Botão "Lista" de inspeção maior e "fofinho" (rounded-full).

### B. Balões de Mensagem (Chat Timeline)
- **Mensagem do Cliente**: Light Mode: Fundo branco, sem bordas coloridas. Dark Mode: Fundo `#1a1a1a`. Sombras: `shadow-sm`.
- **Mensagem do Robô/Mecânico**: Fundo Azul/Índigo Sólido ou quase-sólido (`bg-indigo-600` ou similar), texto em branco absoluto (`#ffffff`), retirando a estética de vidro.
- **Pills de Evento da IA (Demora/Falha)**: Deixar o pill mais largo (ex: `px-5 py-3`), bordas `rounded-2xl`, substituindo a borda colorida pulsante por cores de fundo em pastel ou sólido (ex: Fundo rose claro e texto rose escuro no Light, e inverso no Dark).

### C. Quality Index Drawer (Lateral)
- O menu deslizante passará de um fundo hacker translúcido para uma "folha lateral" sólida: branca no light mode e cinza escura no dark mode.
- Os ícones de Check e Alert serão maciços (sem cores apagadas), deixando nítido o que passou e o que reprovou na vistoria da IA.
