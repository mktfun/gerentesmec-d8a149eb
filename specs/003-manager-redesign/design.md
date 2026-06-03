# Design Specifications (UI/UX 2026 + TripGlide Theme)

## Estilo Visual (Baseado em TripGlide iOS App)
- **Tipografia:** `Instrument Sans` para uma pegada super limpa e amigável. Pesos extra bold (`font-black`) para cabeçalhos e `font-medium` para corpo de texto.
- **Paleta Estrita:**
  - Background Primário: `#f5f6f7` (Cinza muito claro)
  - Superfícies de Cards: `#ffffff` (Branco puro)
  - Texto e Botões de Ação: `#212529` (Quase preto profundo)
- **Componentes TripGlide:**
  - **Tabs/Pills:** Botões em formato de "Pílula" totalmente arredondados (`rounded-full`) com fundo escuro e texto branco quando ativos.
  - **Inbox List:** Itens em lista empilhados (não cards soltos). Sem bordas pesadas; usar divisórias muito sutis ou `bg-white` num container unificado com cantos `rounded-[2rem]`.
  - **Float Action Button (FAB):** O botão principal "Ver Conversa" deve ser um `rounded-full bg-[#212529] text-white` centralizado e grosso, evocando facilidade de uso (tátil).

## Arquitetura de Interface (`ManagerDashboard.tsx`)
- Um controle superior tipo `Segmented Control` ou grupo de botões arredondados (Dashboard vs Caixa de Entrada).
- Se a Aba "Caixa de Entrada" for selecionada, mostrar uma lista `flex-col` simulando uma Inbox real.
- Em cada linha da Inbox: Foto redonda à esquerda, Título/Veículo ao centro-topo, Última mensagem preview abaixo, Score da IA num pill redondo à direita.

## Avaliações Inline (`ChatTimeline.tsx`)
- O Avaliador de IA passará a classificar quais itens do checklist foram "pass" ou "fail".
- Como injetar as notas na timeline sem precisar que a IA atrele um ID exato de mensagem?
  - **Heurística Frontend:** O frontend pode varrer a lista de mensagens do atendente e "pinçar" a primeira que tem um vídeo/imagem anexado para exibir o "badge de Acerto de Vídeo".
  - O painel lateral terá o resumo clássico (Checklist). O painel do centro (chat) terá os badges.

---

# Tasks

- [ ] 1. Renovar a interface `ManagerDashboard.tsx`.
  - Implementar Segmented Control (Tabs: "Oficina/Dashboard" vs "Conversas/Inbox").
  - Transformar a listagem de Leads em uma "Inbox de WhatsApp" (Lista `flex-col` com aparência de chat ao invés de grid de Kanban).
- [ ] 2. Melhorar Estética de Dashboard (TripGlide Theme).
  - Usar Cores `#212529`, `#f5f6f7`, botões `rounded-full`, e bordas `rounded-[2.5rem]` nos contêineres principais.
- [ ] 3. Refatorar Inspector (`ManagerAuditInspector.tsx` / `ReadOnlyAuditPanel.tsx`).
  - No topo do painel de resumo, mostrar um gráfico rosca simples ou dois blocos gigantes "O que Acertou" e "O que Errou" fáceis de ler.
  - Injetar Componentes "Notes da IA" no componente `ChatTimeline.tsx`.
- [ ] 4. Atualizar Player de Mídia (`MessageBubble.tsx`).
  - Trocar a tag de áudio padrão do HTML por uma UI minimalista (Botão circular Play/Pause e uma linha do tempo discreta).
  - Ajustar visualização de imagens/vídeos para ter bordas contínuas e não estourar o container do chat.
