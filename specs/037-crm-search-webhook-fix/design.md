# Design: CRM Search + Webhook Fix

## Layout — Topbar CRM (com busca)

```
┌──────────────────────────────────────────────────────────────────┐
│  [UnitSwitcher ▾] │ [≡][⊞]  │  🔍 [Buscar nome ou número...] [X]  │  [+ Novo Atendimento] │
└──────────────────────────────────────────────────────────────────┘
```

Quando pesquisa ativa (texto digitado):
```
│  [UnitSwitcher ▾] │ [≡][⊞]  │  🔍 [joão silva_____________] [X]  [Global] [Pipeline]  │  [+ Novo] │
```

### Componente Search Input — Design 2026

```css
/* Container */
.search-container {
  flex: 1;
  max-width: 320px;
  position: relative;
}

/* Input */
.search-input {
  width: 100%;
  height: 36px;
  padding: 0 36px 0 34px; /* espaço pra ícone de lupa e X */
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(8px);
  font-size: 13px;
  transition: all 0.2s;
}

.search-input:focus {
  background: rgba(99,102,241,0.08);
  border-color: rgba(99,102,241,0.35);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}
```

### Pills de Scope (aparecem quando há texto)
- `bg-indigo-500/20 text-indigo-400` — ativo
- `bg-white/5 text-white/40` — inativo
- Transição: `opacity 0.15s ease` ao aparecer/desaparecer

---

## Layout — Warning de Inbox Duplicado em Config

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  Conflito de Inbox Detectado                      │
│  As unidades "Loja A" e "Loja B" estão usando o     │
│  mesmo Inbox ID (42). Isso pode causar atribuição   │
│  incorreta de conversas.                            │
└─────────────────────────────────────────────────────┘
```

Estilo: `bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-3`

---

## Webhook Fix — Análise de Payload

### Para `message_created`:
```json
{
  "event": "message_created",
  "id": 12345,              // <- message ID
  "content": "Olá",
  "message_type": 0,       // 0=incoming (cliente)
  "conversation": {
    "id": 678,              // <- conversation ID
    "inbox_id": 5           // <- inbox ID aqui
  },
  "inbox_id": 5             // <- também pode estar aqui (top-level)
}
```

**Fix:** `inboxId` deve pegar `payload.inbox_id || payload.conversation?.inbox_id || payload.inbox?.id`

### Para `conversation_created`:
```json
{
  "event": "conversation_created",
  "id": 678,               // <- conversation ID
  "inbox_id": 5            // <- sempre top-level aqui
}
```
