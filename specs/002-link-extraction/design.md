# Design de Software: Otimização de Extração de Links

Nesta feature não há impacto visual em Frontend UI (Stitch MCP), tratando-se puramente de uma otimização no fluxo da Edge Function em `Supabase MCP`.

## 1. Supabase Backend Model
O processamento ocorrerá na Edge Function `ai-autonomous-evaluator`.
O fluxo será:
1. Recebe Payload (contém `message_content`, `sender_type`).
2. **Gatekeeper:** Verifica `if (sender_type !== 'contact')`. 
   - Se for cliente (`contact`), ignora extração.
   - Se for gerente, prossegue.
3. **Extração Segura (Jina API):** Usa Regex para coletar `urls`. 
   - Faz fetch via `https://r.jina.ai/{url}` com timeout de `12000ms`.
   - Adiciona cabeçalhos `X-Return-Format: markdown` e `X-Target-Selector` se necessário (embora Jina nativo já lide bem).
4. O resultado extraído continua alimentando `scrapedContent` e sendo repassado à prompt engine.
