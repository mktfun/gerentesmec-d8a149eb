# Design: UX Minimalista 2026 (Feature 004)

## 1. Princípios Visuais da UI (TripGlide Style)
- **Fuga do Neon**: Todo brilho excessivo será apagado. Nada de drop-shadows coloridos estilo neon cyberpunk na visão dos gerentes.
- **Formas Naturais (Squircles)**: Botões, cartões principais e barras de navegação devem usar `rounded-[2rem]` ou `rounded-[3rem]` para um aspecto natural, gordo e macio, imitando a referência.
- **Tipografia Instrument Sans**: A fonte atual do projeto será sobreposta por classes de estilo para dar aquele ar premium de viagem. Títulos de cartões grandes, em `font-black` com um tracking super apertado (`tracking-tighter`).

## 2. Paleta de Cores e Tematização (Light / Dark)
- O sistema lerá se há a classe `dark` no corpo da página/html (controlada via hook e botão de sol/lua).
- **Light Mode:** 
  - Fundo Geral: `#f5f6f7`
  - Fundo de Cards: `#ffffff`
  - Títulos: `#212529`
  - Texto Mutado: `#868e96`
  - Botão Primário: `#212529` com texto Branco.
- **Dark Mode:**
  - Fundo Geral: `#050505`
  - Fundo de Cards: `#1a1a1a`
  - Títulos: `#ffffff`
  - Botão Primário: `#ffffff` com texto `#212529`.

## 3. Topologia de Componentes

### A. Bottom Navigation "Pill"
A atual barra superior do `ManagerLayout.tsx` será extirpada. Em seu lugar, teremos um container flutuante preso em `fixed bottom-6 left-1/2 -translate-x-1/2` com largura fixa (aprox. 300px), alto contraste (preto no claro, branco no escuro), com ícones minimalistas (Home, Tema, Sair).

### B. Cabeçalho de Tela (Greetings)
A tela começa com uma margem de topo livre. Título "Sua Oficina" seguido do nome em letras garrafais. Uma pequena search bar ou seletor de "filtros de fila" (estilo "Asia", "Europe" das imagens, só que para Status de Lead: `Fila`, `Atrasados`, `Todos`).

### C. Big Hero Card (Antigo SVG Score)
Substituir a argola de neon vazada por um cartão massivo de fundo (solid color ou gradient brando). Dentro do cartão:
- Texto chamativo: "Sua Pontuação" com valor garrafal (ex: 85) e subtítulo limpo. 
- Um botão largo: "Ler histórico de avaliações".

### D. Cards da Fila de Atendimento
Substituir a lista fininha de linhas do Tailwind por cartões empilhados (ou em grade).
- Ícone de Alerta ou Verificado com fundo arredondado e borda macia.
- Nome do cliente e carro em negrito 18px.
- Botão "Abrir Ficha" engordado e minimalista (Sem setinhas microscópicas, "Anti-burro").
