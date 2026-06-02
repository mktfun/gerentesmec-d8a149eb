# Design Técnico & UI (006-ai-accuracy-ui-fixes)

## Modelagem Supabase MCP
As mudanças de banco de dados e APIs incluem:
1. **Edge Function `ai-autonomous-evaluator`:**
   - Adicionar uma regra matemática para estágios de funil (`STAGE_ORDER: { 'lead_new': 0, 'negotiation': 1, 'quote': 2, 'closed_won': 3, 'closed_lost': 3 }`). O novo estágio só é aceito se o índice for >= ao índice atual (ou tratar 'closed_lost' separadamente).
   - O schema de retorno do LLM será alterado para incluir o campo `audit_reasons` (objeto com as justificativas textuais de por que cada checklist item foi marcado como true).
   - Restaurar lógica de transcrição no LLM: se `media_type` for preenchido (áudio/vídeo/imagem) e a transcrição for extraída, salvar na tabela `chat_messages` (precisaremos criar uma coluna `ai_transcription` do tipo texto ou `jsonb`).
2. **Nova Coluna `chat_messages`:**
   - Adicionar coluna `ai_transcription` (TEXT) em `chat_messages` para gravar o resumo gerado pela IA (em vez de gravar nos Leads).
3. **Nova Coluna `leads`:**
   - Adicionar coluna `audit_reasons` (JSONB) em `leads` para mapear `{"4a": "Marquei porque..."}`.

## Stitch MCP & Componentes (Frontend)
Refatoração de acordo com as diretrizes *UX-UI-Architect-2026*:
1. **`ChatHistoryView.tsx`:**
   - Remover os nós isolados (`item.kind === 'event'`) de dentro de `buildTimeline`.
   - Modificar o `MessageItem` para verificar se `lead.audit_checklist_messages` possui alguma chave (`4a`, `2a`, etc) associada ao ID desta mensagem.
   - Caso positivo, embutir uma micro-div abaixo do balão (ou dentro dele) contendo:
     - Fonte: `font-mono text-[10px] text-muted-foreground/80`.
     - Layout: Borda sutil à esquerda (e.g. `border-l-2 border-emerald-500/30`), paddings mínimos.
     - Texto: Mostrar a label (ex: "✓ Mensagem de Agradecimento Enviada") e a justificativa fornecida pela IA vinda do `lead.audit_reasons`.
2. **Áudios e Mídias:**
   - Caso o `msg.ai_transcription` exista na mensagem, renderizar logo abaixo do áudio um micro-parágrafo itálico, com ícone de "Sparkles" (Lucide), contendo o resumo extraído.
   - Design Liquid Glass: O fundo dessa anotação de IA pode ter um sutíl `bg-white/[0.02]` com backdrop blur extremamente leve, evitando distração severa.
