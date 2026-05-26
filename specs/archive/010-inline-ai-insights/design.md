# Design (Supabase + Stitch)

## Supabase MCP (Banco de Dados)
Para que a UI consiga relacionar um insight da IA a uma mensagem específica, precisamos injetar a coluna de metadados na tabela de histórico de conversas já existente no banco.

**Migração sugerida (SQL via Dashboard ou CLI):**
```sql
ALTER TABLE public.chat_messages ADD COLUMN ai_insight TEXT;
```
Quando o webhook `chatwoot-webhook` invoca o `ai-autonomous-evaluator`, ele já envia o `message_id` atual no payload. O evaluator irá processar o texto e extrair um novo campo no JSON de resposta (`message_insight`). Logo após o LLM responder, o Edge Function fará um `UPDATE` na tabela `chat_messages` localizando o `id = message_id` e salvando esse campo.

## Stitch MCP (Frontend UI)
O foco é não poluir o histórico, usando a tendência de UI *Microinterações* (citado na skill `ux-ui-architect-2026`).

**Alterações Visuais em `ChatHistoryView.tsx`:**
1. A interface `ChatMessage` receberá a propriedade `ai_insight?: string`.
2. O canal Supabase Realtime no `AppDataContext` ou no `ChatHistoryView` deverá escutar também essa coluna (se já for `select('*')`, vai puxar automático).
3. Na renderização do balão do Agente (`sender_type === 'user'`), verificaremos se `ai_insight` existe. Se existir, anexamos imediatamente **abaixo** do balão da mensagem um bloco compacto, translúcido e elegante.
4. **Estilo (Tailwind):** Fundo `bg-indigo-500/10` ou `bg-purple-500/10`, com borda translúcida, ícone pequeno da lucide (`Sparkles` ou `Bot`), texto em `text-[10px]` com fonte *monospaced* ou tracking wide (para parecer um log de sistema), texto na cor `text-indigo-400`.
5. Pode ser implementado um "Accordion" em miniatura, ou seja, aparece só "✨ IA Insight" e o usuário passa o mouse (ou clica) para expandir e ver o texto completo, caso não queira tela poluída. Para melhor produtividade, o modelo *inline* fixo é melhor, mas bem suave.
