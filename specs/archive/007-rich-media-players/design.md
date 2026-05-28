# Design: Rich Media Players (Feature 007)

## 1. Princípios Visuais
- **Apple Liquid Glass**: Uso de botões circulares com blur em backdrops translúcidos e controle exato de opacidade para a interface sobre mídia (botão de Play em cima de vídeos).
- **Design Tátil (Acessibilidade Mobile)**: Botões de player (`Play`, `Pause`, `Mute`) e sliders devem possuir targets de toque grandes (no mínimo 44x44px).

## 2. Componentes

### CustomAudioPlayer.tsx
- Design de Pílula (`rounded-full`).
- Fundo semitransparente: `bg-black/5` no Modo Claro, `bg-white/10` no Modo Escuro.
- Extrema esquerda: Botão circular de Play/Pause gerido pelo React state chamando um `<audio ref={...}>` escondido.
- Centro: Barra de progresso (timeline) simples, feita com divs de background colorido (largura baseada em percentual).
- Extrema direita: Tempo atual do áudio (ex: `0:05 / 0:15`) com fonte pequena e negrito (Instrument Sans).

### ExpandableImage.tsx
- Na linha da mensagem: `<img className="rounded-xl aspect-video object-cover cursor-zoom-in ..." />`
- Uma sobreposição discreta ao fazer hover (ícone de lupa).
- AnimatePresence Modal: Fundo `backdrop-blur-md bg-black/80` com botão `X` flutuante e imagem principal grande no meio.

### CustomVideoPlayer.tsx
- Um contêiner que simula a mesma janela arrendondada `rounded-xl`.
- Para poupar peso e dependências complexas de vídeo customizado, o ideal é envelopar a tag HTML5 `<video>` nativa removendo `controlsList="nodownload"` e aplicando CSS para limpar a poluição visual, ou mesmo forçar abrir num modal de lightbox de mídia igual a imagem, onde o vídeo toca em tamanho grande. 
- Vamos usar a estratégia de clicar na thumbnail e abrir o modal para focar no vídeo sem os controles pequenos. No modal, colocamos o vídeo grande com controles nativos (já que em tela cheia o nativo funciona melhor e atende às expectativas de mobile).
