# Checklist de Implementação (Feature 007)

- `[ ]` 1. CustomAudioPlayer
  - `[ ]` Criar arquivo `src/components/Crm/CustomAudioPlayer.tsx`.
  - `[ ]` Implementar player usando API de refs do React para `HTMLAudioElement`.
  - `[ ]` Adicionar estado de play/pause, formatação de tempo via `date-fns` ou manual, e visual em formato de pílula.
- `[ ]` 2. ExpandableMedia
  - `[ ]` Criar arquivo `src/components/Crm/ExpandableMedia.tsx`.
  - `[ ]` Receber props de `type` (image/video) e `src`.
  - `[ ]` Renderizar uma miniatura elegante (`aspect-video`, bordas curvadas, ícone de expansão ao focar).
  - `[ ]` Modal em AnimatePresence (framer-motion) de tela inteira escurecida exibindo a imagem/vídeo nativo centralizado ao clicar.
- `[ ]` 3. Integração nas Views de Chat
  - `[ ]` Substituir ocorrências de `<audio controls>` pelo `<CustomAudioPlayer />` em `ChatHistoryView.tsx`.
  - `[ ]` Substituir ocorrências de `<img src=...>` e `<video controls ...>` pelo `<ExpandableMedia />` em `ChatHistoryView.tsx`.
  - `[ ]` Repetir as substituições no `ManagerAuditInspector.tsx`.
- `[ ]` 4. Garantia de Build e UX
  - `[ ]` Checar se múltiplos áudios renderizados ao mesmo tempo não quebram o state.
  - `[ ]` Rodar `npm run build` e validar as telas.
