# Design: UI and Data Model (011)

## 1. Banco de Dados (Supabase MCP)

A tabela `leads` sofrerá uma migração simples para acomodar as justificativas da IA:
- **Tabela:** `public.leads`
- **Nova Coluna 1:** `funnel_stage_reason` (Tipo: `TEXT`, Nullable: `TRUE`) -> Armazena a justificativa óbvia em texto corrido (Ex: "Cliente não aceitou o orçamento de R$ 500").
- **Nova Coluna 2:** `audit_reasons` (Tipo: `JSONB`, Nullable: `TRUE`) -> Dicionário mapeando os IDs de checklist (`1a`, `2c`, etc) aos seus respectivos motivos de falha.

*Typescript Interface Updates:*
Em `src/integrations/supabase/types.ts`, os tipos Row, Insert e Update da tabela `leads` receberão:
```typescript
funnel_stage_reason?: string | null
audit_reasons?: Json | null
```

## 2. Frontend & Interface de Usuário (Stitch MCP)

De acordo com as diretrizes da *ux-ui-architect-2026*, as justificativas de falha não devem poluir a tela, mas devem estar imediatamente acessíveis e óbvias.

### 2.1. AuditPanel / ManagerAuditInspector (Checklist)
- **Visualização de Erros (Items com `false`):** 
  - Ao lado de um item marcado como `false`, exibiremos um ícone sutil de `AlertCircle` ou `Info` com uma cor vermelha/âmbar suave (Soft Red).
  - Ao passar o mouse (Hover Tooltip) ou em formato de Subtexto Reduzido, o `audit_reasons[item.id]` será renderizado.
  - O texto será formatado em `text-[10px] text-rose-500/80` logo abaixo da descrição do item para que o mecânico veja na hora, sem precisar clicar.

### 2.2. Header do Lead (Funnel Stage Reason)
- Se o Lead estiver como **PERDIDO** (`closed_lost`) ou **GANHO** (`closed_won`), haverá um `Banner` estilo *Liquid Glass* (fundo translúcido avermelhado ou esverdeado dependendo do status) logo abaixo do nome do cliente, exibindo:
  - *"Motivo (IA): Cliente achou o preço incompatível."*
- Essa informação também será passada visualmente para a Pipeline (Kanban), se viável, mostrando um badge com tooltip.

## 3. Alterações na Edge Function (`ai-autonomous-evaluator`)
- **Regex:** Substituir `/(https?:\/\/[^\s]+)/g` por um regex universal que capte domínios padrão (`/\b(?:https?:\/\/)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi`). Na hora de usar o `jinaUrl`, faremos um `if (!url.startsWith('http')) url = 'https://' + url;`.
- **System Prompt:** Atualizar o prompt para preencher os dois novos campos obrigatórios no JSON: `stage_change_reason` e `audit_reasons`.
- **Persistência:** Atualizar o objeto `updatePayload` para salvar esses campos no banco quando estiverem presentes na saída da IA.
