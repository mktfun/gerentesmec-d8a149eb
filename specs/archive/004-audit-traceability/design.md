# Design - Rastreabilidade de Auditoria (UI & Backend)

## 1. Banco de Dados (Supabase)
Precisamos guardar o ID das mensagens que ativaram os checklists.
Como a tabela `leads` já possui um campo JSONB `audit_checklist`, adicionaremos uma nova coluna chamada `audit_checklist_messages` (tipo JSONB).
**Formato esperado:**
```json
{
  "1a": "id-da-mensagem-que-ativou-o-check-1a",
  "2b": "id-da-mensagem-que-ativou-o-check-2b"
}
```

## 2. IA / Edge Function (`ai-autonomous-evaluator`)
Na edge function, vamos comparar o `audit_checklist` que o LLM retornou com o `audit_checklist` antigo do Lead.
Se o LLM retornou `true` para um item que antes era `false` (ou null), sabemos que foi a `message_id` atual que serviu de evidência!
**Não precisamos gastar tokens da LLM para isso**. É uma lógica determinística no nosso backend!
```typescript
const currentChecklist = lead.audit_checklist || {};
const newMessagesMap = lead.audit_checklist_messages || {};

for (const key of Object.keys(mockOutput.audit_checklist)) {
   if (mockOutput.audit_checklist[key] === true && !currentChecklist[key]) {
       // Item virou TRUE agora! Esta mensagem é a evidência.
       newMessagesMap[key] = message_id;
   }
}
```

## 3. Frontend UI (`AuditPanel.tsx`)
Quando mapearmos as perguntas (1a, 1b, etc.), verificamos se a chave existe no objeto `lead.audit_checklist_messages`.
Se existir e o item estiver marcado como `true`, exibimos um pequeno ícone de `Target` ou `Eye` no canto direito da linha.
**Visual 2026:**
- Botão pequeno e sutil: `text-emerald-500/50 hover:text-emerald-400 bg-emerald-500/10 p-1 rounded-full`.
- Tooltip: "Ver evidência no chat".
- Ação ao clicar: Aciona `onHighlightMessage(messageId)`.

## 4. Frontend UI (`ChatHistoryView.tsx`)
A view de histórico receberá uma `prop` opcional `highlightMessageId?: string`.
Use um `useEffect` para rolar (`scrollIntoView`) até o `div` com `id={highlightMessageId}` suavemente.
Adicione uma classe dinâmica ou uma animação `framer-motion` (ex: borda pulsando em emerald por 3 segundos) quando a mensagem for a destacada.
