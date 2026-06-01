# Design e Arquitetura (Spec 014)

## 1. Banco de Dados (Supabase)
### Tabela `leads`
Precisaremos armazenar os insights do checklist. Atualmente temos `audit_checklist` que salva booleano. 
Podemos adicionar uma nova coluna:
- `audit_justifications` (`JSONB`, default: `{}`) -> Guardará as explicações retornadas pelo LLM para cada nota.
*Alternativamente*, não precisamos de migração se pudermos reusar `audit_checklist_messages` ou guardar no mesmo payload. Mas para separar bem:
Vamos criar uma nova coluna `audit_justifications` em `leads`.

### Tabela `chat_messages`
Precisamos armazenar a transcrição da mídia se houver.
- `metadata` (`JSONB`, default: `{}`) -> Essa coluna deve existir. Podemos salvar algo como `{"media_summary": "Transcrição do áudio aqui"}` na mensagem enviada.
Como a IA processa o lote de mensagens no Edge Function e as mensagens já existem, a IA retornará um objeto `media_summaries` contendo a justificativa da última mensagem. Porém, não sabemos o ID exato facilmente.
*Abordagem Alternativa:* Ao invés de atualizar o `metadata` da mensagem específica, a IA simplesmente responde com um novo `chat_messages` do tipo `system` cujo `content` seja algo do tipo: `[MÍDIA ANALISADA] Áudio de 15s: "Gerente avisa sobre correia dentada e aprova."`. Isso não requer mudar schema, basta renderizar bonitinho no frontend se o conteúdo começar com `[MÍDIA ANALISADA]`.

## 2. API (Edge Function `ai-autonomous-evaluator`)
- **JSON Schema:**
  - Adicionar chave `"audit_justifications": { "1a": "O gerente disse...", ... }`
  - Adicionar chave `"media_summary": "resumo..."` ou simplesmente instruí-la a incluir um `message_insight` especial se processar mídia.
  Melhor: Vamos instruir o LLM a injetar a transcrição na própria chave genérica `message_insight`, e o frontend vai exibir isso como uma balão na timeline. Se o `message_insight` tiver formatação especial ou se usarmos um campo `closing_summary` atualizado, o gerente consegue ver. Mas o usuário pediu explicitamente "abaixo da mídia".
  Se queremos "abaixo da mídia", a IA deve retornar as justificativas. Vamos atualizar o prompt.

## 3. Frontend (UI)
- `AuditPanel.tsx` e `ReadOnlyAuditPanel.tsx`: Ler `lead.audit_justifications` e exibir abaixo do título do checklist com texto `text-[10px] text-muted-foreground italic`.
- `ChatHistoryView.tsx`: Ler as mensagens do sistema que contém insights de mídia e exibi-las estilizadas perto do balão original.
- **Correção Botão Salvar UX (`AdvancedAiPanel.tsx`)**: No botão "Aplicar Modificações", colocar um aviso de que "A Rota AI salva apenas via botão Diagnóstico Inteligente. Aqui salvam-se os Prompts". Melhor: transferir o salvamento das rotas para cá ou descer o botão Diagnóstico para agrupar as ações. Vamos adicionar um alerta UI/UX forte e instrucional.
