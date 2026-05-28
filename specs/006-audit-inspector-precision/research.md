# RPI-R: Pesquisa e Contexto (Feature 006)

## 1. Mapeamento do Código Atual
- No momento, `ManagerAuditInspector.tsx` injeta alertas de qualidade na timeline utilizando uma lógica heurística baseada no tamanho do array de mensagens (`STEP_WINDOWS`), onde o sistema deduz que um checklist da etapa 4 vai aparecer no final, e da etapa 1 no início.
- Isso gera marcações falsas, forçando eventos da IA em locais do chat que não correspondem com a realidade, o que frustra profundamente o uso gerencial.
- O backend de Inteligência Artificial já salva o ID exato da mensagem que comprovou o checklist no objeto `lead.audit_checklist_messages` (`Record<string, string>`).
- O rendering das mensagens não leva em conta propriedades ricas de mídia (`media_url`, `media_type`). Mensagens com foto ou áudio chegam apenas como texto cru (ou com marcações de string como `[ANEXO ENVIADO: audio]`).

## 2. Necessidades de Negócio & Feedback
- O usuário detestou o ruído visual das tags aparecendo no meio da conversa do nada. Exigiu precisão.
- Solicitou que a explicação da IA (que já temos em `qualityFeedbackMap`) seja exibida como uma "notinha simples e minimalista abaixo da mensagem onde o score foi marcado".
- Solicitou rendering rico de anexos: Imagens devem aparecer como imagens (com thumbnail), Áudios devem aparecer com player de áudio HTML nativo.
- O web design geral foi considerado "duro" e "morto", o que exige mais capricho nas animações (Framer Motion estrito com spring/physics) e refinamento de sombras/bordas (design vivo, Liquid Glass).

## 3. Lacunas para Adaptação
- **Data Model**: Atualizar a interface `ChatMessage` no `ManagerAuditInspector.tsx` para incluir `media_url?: string` e `media_type?: string`.
- **Lógica de Timeline**: Remover 100% da injeção cega de `events`. Criar um mapeamento onde cada `message` renderiza abaixo de si a "nota da IA" se o seu ID for correspondente a um dos valores em `lead.audit_checklist_messages`.
- **Media Render**: Criar pequenos utilitários inline para renderizar `<img>` se `media_type` iniciar com `image/`, ou `<audio controls>` se for `audio/`.
- **Filtro de Texto Bruto**: Se a mensagem tiver texto `[ANEXO ENVIADO: audio]`, ele pode ser cortado/escondido, pois a mídia nativa já estará lá.
