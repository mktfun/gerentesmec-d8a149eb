# Research: Manager View Redesign & Audit Inspector Enhancements

## 1. Contexto e Problema Reportado
O usuário solicitou 3 grandes melhorias:
1. **Redesign da Visão do Gerente:** O layout atual usando cards estilo "Kanban" (lado a lado) está ruim. O usuário deseja separar o "Dashboard" (resumo) de uma "Lista de Conversas", adotando um formato semelhante ao WhatsApp para a listagem.
2. **Nova Identidade Visual:** O design deve ser inspirado em imagens fornecidas (Tema claro/escuro com grandes arredondamentos, tipografia "Instrument Sans", cores `#212529`, `#f5f6f7`, `#ffffff` e layout estilo Dribbble iOS App).
3. **Inspetor de Auditoria e Timeline:**
   - Na visão do Inspetor, a timeline de mensagens (chat) deve apresentar as "notinhas" (avaliações da IA) renderizadas em linha (inline), logo abaixo da mensagem exata onde o vendedor pontuou (ou errou).
   - Deve haver um painel geral rápido ("o que ele erro geral facilmente e oq acertou").
   - Melhorar o player de áudio, vídeo e imagem, garantindo que não quebrem o layout ou se sobreponham na timeline.
4. **Problema Global (Resolvido):** Caracteres Unicode corrompidos foram consertados. O workflow de substituição de texto precisa manter o charset UTF-8 integro.

## 2. Análise Técnica (Root Cause e Viabilidade)

### 2.1 Separação Dashboard vs Lista (`ManagerDashboard.tsx`)
Atualmente, `ManagerDashboard.tsx` exibe o Hero Card de métricas e logo abaixo a listagem de Leads.
Para adotar o novo padrão, podemos:
- Criar um componente de "Aba" (Tabs) ou Toggle flutuante estilo iOS (`SegmentedControl`) alternando entre "Visão Geral" (Dashboard) e "Caixa de Entrada" (Lista de Conversas).
- A Lista de Conversas será repaginada para parecer uma Inbox (WhatsApp/Telegram), contendo avatar, nome do cliente, data, preview da última mensagem e o "Score" em destaque.

### 2.2 Notas Inline na Timeline (`ManagerAuditInspector.tsx` e `ChatTimeline.tsx`)
O banco de dados de `chat_messages` não possui uma coluna com os "acertos/erros" atrelados por mensagem. A IA avalia a conversa inteira como um todo.
No entanto, o JSON retornado pela IA (`lead.score_rationale`) contém as lógicas de onde o vendedor pontuou. E o webhook atual *não* atrela a avaliação a cada `message_id`.
Como podemos simular as "notinhas abaixo da mensagem"?
O Avaliador atual (`edge function`) retorna um resumo de `audit_checklist`. Se precisarmos mostrar *abaixo da mensagem*, a UI precisará inferir qual mensagem disparou a nota (baseado em palavras-chave? Ou mudar o prompt da IA para incluir timestamps das mensagens?).
Alternativa Viável Imediata: Mostrar as notas intercaladas na timeline como "Eventos de IA" ou simplesmente destacar a mensagem que tem um anexo e abaixo colocar um balão: "IA: Ponto de Checklist de Áudio/Vídeo detectado".
Ou, alterar a interface para ter um Resumo "Acertos / Erros" fixo na tela e ao clicar em um acerto, ele rola (scroll) até a área relevante. O usuário pediu: "na conversa ao ir subindo... vai vendo as notinhas da ia no que ele acertou".
Podemos criar um parser no Frontend que mapeia os passos do checklist para as mensagens do vendedor (ex: "Mandou vídeo?" -> acha a mensagem de vídeo e injeta a nota embaixo).

### 2.3 Melhoria do Player de Áudio/Vídeo (`ReadOnlyAuditPanel.tsx`)
O componente `MessageBubble` lida com anexos. A reformulação exigirá:
- Um AudioPlayer customizado moderno, e não o `<audio controls>` padrão do navegador.
- Um Lightbox elegante para vídeos e imagens, com blur de fundo e cantos arredondados condizentes com o tema TripGlide.

## 3. Diretrizes de Design (UX/UI 2026 + TripGlide Theme)
- Fonte Oficial: `Instrument Sans`.
- Paleta: Black (`#212529`), Light Gray (`#f5f6f7`), Pure White (`#ffffff`).
- O "TripGlide" theme utiliza cartões flutuantes brancos num fundo cinza claro, botões totalmente arredondados (`rounded-full`), ícones limpos em preto/branco com alto contraste.
- Maximalismo e legibilidade: Foco total no conteúdo, com botões pretos (dark mode na base) e cards com sombras extremamente suaves (`shadow-sm`, `border border-black/5`).
