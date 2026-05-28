# Proposta: Componentes de Mídia Ricos (Feature 007)

## 1. Requisitos
1. **AudioPlayer Elegante**: Substituir as tags nativas `<audio controls>` por um componente React customizado que possua um design alinhado (minimalista, controles próprios via Lucide Icons, barra de progresso em linha e tempo dinâmico).
2. **ImageViewer Expandível**: As imagens em anexo devem ter proporções limitadas no chat (ex: não estourar a tela inteira em altura) e devem conter um ícone de "Expandir". Ao serem clicadas, abrem uma visualização Lightbox centralizada que permite o zoom.
3. **VideoPlayer Imersivo**: Substituir as tags nativas `<video controls>`. Criar um componente onde o vídeo aparece como um thumbnail em formato card e, ao interagir (clique no play), a reprodução ocorra com uma UI controlada (sem baixar os controles cinzas horríveis padrão do Chrome/Safari).

## 2. User Stories
- **Como Mecânico/Gerente**, eu quero ouvir um áudio recebido pelo WhatsApp usando uma interface limpa que não destoe do tema do sistema, **para que** o software pareça premium e eu consiga arrastar a linha do tempo sem errar o dedo (dedo gordo no celular).
- **Como Mecânico/Gerente**, eu quero tocar numa imagem enviada pelo cliente (foto da peça quebrada) e vê-la em tela inteira, **para que** eu analise o defeito minuciosamente sem precisar baixar o arquivo ou espremer os olhos.

## 3. BDD Scenarios

### Cenário: Reprodução de Áudio Customizada
- **Given (Dado):** Uma mensagem do chat contém um anexo de áudio do WhatsApp.
- **When (Quando):** A mensagem é exibida na tela do funil ou do inspetor.
- **Then (Então):** A tag HTML5 de áudio nativa não é exibida; no lugar, aparece um botão Play roxo/esmeralda com uma linha do tempo e o tempo formatado (`00:15`). Ao clicar, o áudio toca e a linha progride suavemente.

### Cenário: Lightbox de Imagem
- **Given (Dado):** Uma mensagem contém a foto de um radiador vazando.
- **When (Quando):** O usuário clica em cima da miniatura na conversa.
- **Then (Então):** Um overlay escuro desfocado preenche a tela, exibindo a imagem em seu tamanho máximo centralizado e permitindo fechar ao clicar no "X" ou fora dela.
