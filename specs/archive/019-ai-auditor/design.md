# Design: Arquitetura Multi-Agente & RAG (019)

## Supabase & Backend Architecture
O padrão Multi-Agente será orquestrado via **Supabase Edge Functions** usando a API da OpenAI.

### 1. Vector Database (A Fundação RAG)
Para suportar o RAG e a Memória do Agente, precisaremos habilitar e configurar o `pgvector`:
- Criaremos uma *migration* para habilitar `create extension vector`.
- A tabela `chat_messages` (ou uma nova tabela `message_embeddings`) terá uma coluna `embedding vector(1536)`.
- Criaremos uma *function* SQL para `match_messages` para a busca vetorial por similaridade.

### 2. Edge Function: `ai-auditor-router`
- Um Edge Function Deno será o ponto de entrada, acionado por um Database Webhook (`INSERT` em `chat_messages`).
- Ele rodará um modelo LLM principal rápido que possui as seguintes **Tool Calls (Function Calling)**:
  - `analyze_image(url)` -> Chama o gpt-4o (vision) se a mensagem for imagem.
  - `transcribe_audio(url)` -> Chama o Whisper + prompt de análise de sentimento.
  - `update_audit_checklist(leadId, score)` -> Quando identifica que uma métrica do score foi atendida.

## Abstração "Mentes Bem Divididas"
A arquitetura de prompt no código será injetada como "Personas" para garantir precisão cirúrgica sem alucinar:

- **Router Mind**: Prompt focado apenas em classificar a intenção e delegar.
- **Judge Mind**: Prompt com as regras de negócio ESTRITAS do Dossiê. Ele receberá o histórico estruturado e deverá responder estritamente um JSON com:
  `{ "cordialidade": true/false, "enviou_orcamento": true/false, "justificativa": "..." }`

## Componentes UI (`Crm.tsx` & `AuditPanel.tsx`)
A interface deve espelhar o trabalho autônomo da IA:
1. No `AuditPanel.tsx`, os checkboxes manuais serão convertidos (ou coexistirão) com estados **[IA Visto]**, ganhando ícones de brilho (Sparkles ✨) para indicar avaliação algorítmica.
2. A listagem do Kanban receberá os updates em tempo real do Score via Subscription do Supabase.
