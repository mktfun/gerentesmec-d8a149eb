# RPI-R: Pesquisa e Contexto (Feature 004)

## 1. Mapeamento do Código Atual
- **`src/components/Layout/ManagerLayout.tsx`**: Header estático no topo, e um layout empilhado verticalmente. As referências mostram um design mais limpo com navegação em barra flutuante em formato de "Pílula" (Pill) embaixo ou navegação muito limpa, sem headers pesados no topo.
- **`src/pages/ManagerDashboard.tsx`**: Contém uma Hero section de neon escuro, com um círculo SVG animado, fundo dark (`#050505` ou similar), e lista de cards escuros de cada lead. O design atual é focado em aspecto noturno cyberpunk/Apple Glass escuro.

## 2. Análise do Benchmarking (Imagens de Referência)
A imagem "TripGlide" revela um design UX radicalmente oposto:
- **Cores & Temas**: Fundo sólido `#f5f6f7` (Claro) ou `#212529` (Escuro). Ausência de brilhos pesados (sem neons). 
- **Tipografia**: `Instrument Sans` predominante (geométrica, grossa para títulos, legível). Hierarquia clara de tamanhos.
- **Elementos UI ("Anti burro")**:
  - Cards grandes e muito arredondados (border-radius `2rem` a `3rem`).
  - Imagens de fundo ou cores sólidas pastéis em cards de topo.
  - Botões grossos e escuros (pretos) com cantos perfeitamente arredondados (pills).
  - Filtros em formato de pílula (`Asia`, `Europe`, etc). No nosso caso, podem ser `Hoje`, `Semana`, `Mês`.
  - Bottom Navigation bar flutuante, larga, escura, centralizada na parte inferior da tela, com ícones brancos delineados simples.
  - Lista de itens em formato de cartões verticais brancos (ou escuros no dark mode) que se distinguem do fundo cinza/preto-matte.
  - Alvos de toque enormes (touch targets).

## 3. Lacunas para Adaptação
- O Dashboard do Mecânico precisa ser traduzido do contexto "TripGlide" (viagens) para o contexto de oficina (auditorias). 
- Onde antes havia fotos de destinos de viagem (como "Rio de Janeiro"), agora teremos as informações vitais do gerente (Sua Nota/Score) no topo, talvez usando um card preenchido com um gradiente simples ou cor forte e o restante bem limpo.
- Em vez de pacotes de viagem, teremos a "Lista de Veículos / Clientes" com "Ler mais / Ver ficha".
- É mandatório suportar Light e Dark mode. Atualmente a plataforma força um visual sombrio global. Vamos precisar adaptar a estrutura para respeitar as classes `dark:` do Tailwind ou criar uma chave manual no app.
- Navegação inferior flutuante: O "ManagerLayout" deverá substituir o header de topo padrão por uma navegação inferior (Bottom Bar Flutuante) nos celulares, contendo os atalhos (Dashboard, Perfil, Sair).
