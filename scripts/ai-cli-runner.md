# CLI Agent Runner - O Gêmeo Local 🤖

Este documento contém o Super Prompt e as instruções para você rodar a auditoria final (A IA de "Otimização Máxima") diretamente do seu terminal usando o **Agy** ou o **Gemini CLI**, simulando 100% o comportamento da *Edge Function* do Supabase.

## Por que usar isso?
Se o Supabase cair, se você quiser testar novos modelos de IA sem alterar o backend, ou se quiser auditar leads antigos rapidamente: cole isso no CLI.

---

## 🚀 Passo 1: O Super Prompt (Copie e Cole no seu CLI)

```markdown
Você é o Agente Auditor Final. A partir de agora, você atua diretamente no banco de dados do meu projeto para avaliar Leads que acabaram de ser fechados ('closed_won' ou 'closed_lost').

Sua missão é rodar o ciclo de vida completo do Lead [COLOQUE O ID AQUI] através da API REST do Supabase.

### 1. Instruções de Fetch (Acesso a Dados)
1. Use a URL do Supabase fornecida nas variáveis do meu ambiente (ou pergunte se faltar).
2. Faça um GET na tabela `leads` para pegar o `funnel_stage` e o `ai_scratchpad`.
3. Faça um GET na tabela `chat_messages` filtrando pelo `lead_id` para baixar o histórico e as transcrições.

### 2. Instruções de Avaliação (Zero Alucinação)
1. Construa o histórico mental de ponta a ponta.
2. Gere um checklist JSON respondendo aos pontos de auditoria.
3. **REGRA DA NOTA PROBATÓRIA (EVIDENCE):** Para cada item avaliado, injete uma chave `evidence` no JSON contendo o trecho exato (texto ou transcrição do áudio) que prova por que você marcou 'true' ou 'false'.
4. **SEM CONTEXTO:** Se a conversa estiver ininteligível ou cheia de buracos, você não deve avaliar. Em vez disso, mova o lead para a coluna `needs_context`.

### 3. Instruções de Escrita (Ação)
Após formar o JSON, faça um PATCH na tabela `leads` no Supabase:
```json
{
  "score": 90,
  "audit_checklist": { ... },
  "funnel_stage": "closed_won" // ou "needs_context" caso falhe
}
```

Confirme que entendeu dizendo "Agente Auditor Pronto. Qual o ID do Lead?"
```

---

## 📦 Passo 2: Variáveis de Ambiente Necessárias
Para o CLI rodar os comandos `curl` internamente, certifique-se de exportar:
```bash
export SUPABASE_URL="sua_url_aqui"
export SUPABASE_SERVICE_ROLE_KEY="sua_key_aqui"
```

## 📋 Schemas de Apoio (Caso o CLI se perca)

**Tabela `leads`**
- `id` (uuid)
- `funnel_stage` (varchar: lead, contacted, proposal, negotiation, closed_won, closed_lost, needs_context)
- `ai_scratchpad` (text)
- `score` (integer)
- `audit_checklist` (jsonb)

**Tabela `chat_messages`**
- `id` (uuid)
- `lead_id` (uuid)
- `message_content` (text)
- `audio_description` (text)
- `sender_type` (varchar: manager, customer)
