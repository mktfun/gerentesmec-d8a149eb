# RPI-R: Pesquisa e Contexto (Feature 007)

## 1. Mapeamento do Código Atual
- O projeto possui 2 componentes que renderizam histórico de conversas: `ChatHistoryView.tsx` (visão do funil/lead) e `ManagerAuditInspector.tsx` (visão do painel de Vistoria do Gerente).
- Em ambos, mídias como áudio e vídeo estão utilizando as tags HTML5 puras (`<audio controls>` e `<video controls>`).
- Imagens estão sendo renderizadas usando tags `<img>` básicas, porém sem controle de clique para expandir (lightbox/zoom) e muitas vezes com proporções ruins, além de faltar um acabamento premium.
- As tags HTML5 nativas quebram o design system: elas variam de acordo com o navegador, são opacas, bloqueiam layouts responsivos e possuem baixa fidelidade estética (não combinam com o Liquid Glass ou design 2026).

## 2. Necessidades de Negócio & Feedback
- "Horrível para ouvir áudio, ver vídeo e ver imagem tanto no PC quanto no celular."
- O usuário pediu melhoria radical na experiência de reprodução de mídia para as duas visualizações (Gerente e Mecânico).

## 3. Lacunas para Adaptação
- **Custom Audio Player**: Precisamos de um componente React dedicado a áudio, que utilize a API do `HTMLAudioElement` em background mas exponha uma UI proprietária desenhada com `framer-motion` (botão de play, barra de progresso simulada ou real, tempo formatado).
- **Custom Image Viewer**: Imagens devem ser contidas num aspecto agradável (aspect-video ou quadrado com object-cover) e ao clicar, abrir um modal de visualização expandida (Lightbox) para permitir zoom nos detalhes de uma peça quebrada.
- **Custom Video Player**: Parecido com a imagem, o vídeo não deve mostrar controles sujos do navegador. Deve mostrar um poster ou o primeiro frame com um grande botão central de `Play`. Ao clicar, ele pode rodar inline com controles limpos criados via overlay, ou expandir para fullscreen.
