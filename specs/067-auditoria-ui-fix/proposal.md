# Spec 067: Correção Visual (Edge-to-Edge) da Execução de Auditoria

## 1. Visão Geral
A tela de execução de auditoria (Stepper) está com uma aparência engessada (parecendo um "Card" flutuando solto) que não se mescla bem com o Header e causa bugs visuais e sobreposições (ex: borda arredondada "cortando" a barra inferior ou o header parecendo desconexo). A proposta é remover o efeito de "Card" em caixa (`max-w-lg`, `rounded-2xl`, margins) e transformar o container em um layout **Edge-to-Edge** nativo (fluido, preenchendo as pontas).

## 2. Problemas Identificados (Screenshot)
- O Header (`AuditoriaExecution`) flutua sobre um fundo cinza e a imagem/câmera do item fica exprimida dentro de um card central.
- A "label" preta (badge "Externo") cruza o padding do card.
- A rolagem vertical está gerando sobreposições com a barra de navegação (Footer).
- A imagem fica em um bloco branco arredondado `rounded-[2rem]` com padding forte nas extremidades (`p-4`), gastando espaço valioso de tela.

## 3. Escopo de Alteração Visual

### 1. `AuditoriaExecution.tsx` (Layout Wrapper)
- Remover o padding exagerado `p-4` do wrapper da área central. A área vai se tornar `p-0` ou apenas ter padding X onde houver texto.
- O header continuará fixo no topo, mas sem a sensação de estar "descolado" do conteúdo.

### 2. `AuditoriaItemCard.tsx` (Edge-to-Edge)
- Remover o `max-w-lg mx-auto bg-card border rounded-[2rem] shadow-2xl mt-4`.
- Substituir por um container `w-full h-full flex flex-col bg-background`.
- A área de foto (`h-[40vh]`) passará a encostar nas beiradas da tela do celular (sem bordas brancas laterais), ganhando um visual 100% imersivo (Instagram/TikTok style).
- Mover as informações de padding interno e espaçamentos (como o título "Fachada" e os botões de ação) para que não grudem na tela, garantindo que o texto tenha respiro.

## 4. Analise de Impacto
- **Funcional:** O fluxo permanece inalterado.
- **Visual:** O layout para de parecer um Modal engessado no meio de um fundo escuro e passa a ser uma tela completa. O visual premium (Imersivo) solicitado nas diretrizes será finalmente alcançado.
