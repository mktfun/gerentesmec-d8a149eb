# Design (Arquitetura)

## 1. UI Components (Stitch)
### A. `AuditPanel.tsx`, `ChatHistoryView.tsx`, `ReadOnlyAuditPanel.tsx`
- **O Problema:** A linha `else if (lead.score !== null) { setChecked({ '1a': true, ... }) }` tenta simular um fallback visual, mas na verdade deturpa conversas avaliadas com nota baixa/zero.
- **A Correção:** Excluir esse fallback de todos os componentes de visualização da UI. Se `audit_checklist` for nulo/vazio, inicializar como `{}` independente se `score !== null` ou não. O `lead.score` é apenas um reflexo do que foi salvo, não dita preenchimento automático visual.

## 2. API Edge Function (Supabase)
### A. `ai-autonomous-evaluator/index.ts`
- **Mídia no Local Proxy:** 
  - Hoje o código possui `if (actualMime.startsWith('image/'))` para montar o `image_url` data-URI do provedor customizado. Ele descarta áudio e vídeo com a mensagem: *"Smart Routing: Mídia tipo X ignorada..."*
  - **Correção:** Vamos alterar o roteamento (bloco `else` na linha ~500) para **incluir** áudios e vídeos se o provedor for o Local AI Proxy, convertendo tudo para Data URI base64, assumindo que o proxy CLI conseguirá mapear a chamada para a interface correta do Gemini-CLI (que suporta áudios e vídeos diretamente).
- **Prompt LLM:**
  - Adicionar a regra: `O JSON "audit_checklist" DEVE ser retornado APENAS com chaves dos itens explicitamente ganhos/vistos. Se for o início do atendimento e não houve orçamento/checklist, NADA deve ser preenchido (não invente "true" para itens sem prova).`
  - Re-forçar: `Para 1a e 1b, você é PROIBIDO de marcá-los como true no início do atendimento.`
