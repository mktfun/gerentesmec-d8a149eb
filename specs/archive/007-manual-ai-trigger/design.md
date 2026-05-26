# Design: Botão "Sincronizar IA"

## Interface Gráfica (UI - Stitch MCP)
- **Localização:** Em `AuditPanel.tsx`, na seção superior direita, onde já reside o link para o Chatwoot.
- **Visual:** Botão `<Button variant="outline" size="sm">` ou `<Button variant="ghost" size="sm">`.
- **Ícone:** Um ícone lúcido e sutil, como `<Sparkles className="w-4 h-4 mr-2 opacity-50" />` (do `lucide-react`). O texto pode ser "Sincronizar" ou "Reavaliar".
- **Estado de Carregamento:** Durante o clique, o botão entra em estado `disabled` e exibe um spinner, impedindo cliques múltiplos e indicando o processamento assíncrono.

## Lógica e Acionamento (Supabase MCP)
- No `AuditPanel.tsx`, existe o estado `realMessages` que possui todas as mensagens da conversa.
- O botão "Reavaliar", ao ser clicado:
  1. Pegará as últimas N mensagens não processadas (ou todo o chat se preferir que a IA compacte tudo de novo de forma bruta).
  2. Juntará todas em uma string consolidada: `[Contato]: Olá \n [Agente]: Oi, tudo bem?`.
  3. Fazer a requisição para a Edge Function existente `ai-autonomous-evaluator` com payload:
     ```json
     {
       "lead_id": lead.id,
       "message_content": "CONVERSA CONSOLIDADA:\n...",
       "message_id": "manual_sync"
     }
     ```
- O Edge Function `ai-autonomous-evaluator` receberá esse texto gigantesco, enviará para a LLM, criará o resultado e atualizará o `lead_memories` comprimindo o conteúdo passado. Isso faz com que a IA seja "alimentada em lote".
