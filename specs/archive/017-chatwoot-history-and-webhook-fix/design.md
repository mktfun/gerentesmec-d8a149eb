# Design: Histórico de Conversa Premium & Webhook Fix

## Visão Geral da Solução
Faremos um split no Modal de Auditoria (`AuditPanel.tsx`) e modelaremos o banco para escalar a recepção das mensagens do Webhook de forma robusta e persistente.

## 1. Banco de Dados (Supabase MCP)
### Novas Tabelas (Migração)
Criaremos a tabela `chat_messages` para ser o Source of Truth local das conversas, sem depender da API externa no momento de leitura da auditoria.

*   **Tabela `chat_messages`**:
    *   `id` (uuid, PK)
    *   `lead_id` (uuid, FK para `leads`)
    *   `chatwoot_message_id` (integer, unique) - para evitar duplicatas de webhook
    *   `content` (text)
    *   `sender_type` (text) - Enum: `contact` (cliente), `user` (agente/gerente), `bot`.
    *   `created_at` (timestamp, indexado)

### Webhook Engine (`chatwoot-webhook`)
*   Refatoração do parser JSON (`index.ts`):
    *   Verificar a existência de `payload.inbox_id` (fallback para `payload.inbox.id`).
    *   A extração do contato será `payload.meta?.sender || payload.conversation?.meta?.sender || payload.sender`.
    *   Se `event === 'message_created'`, o payload será inserido ou em *upsert* na nova tabela `chat_messages`.

## 2. Interface de Usuário (Stitch MCP + UX 2026)

### Novo Componente: `ChatHistoryView`
Será incorporado dentro do `AuditPanel.tsx`, dividindo a tela.
*   **Layout:**
    *   Left Column (60%): Histórico do Chat (Mocked primeiro, depois real).
    *   Right Column (40%): Checklist de Auditoria e formulários que já existem.
*   **Estética 2026 (Apple Liquid Glass & Maximalismo):**
    *   **Fundo do Chat:** Cor de fundo levemente mais escura ou translúcida (`bg-[#0a0a10]`) para criar profundidade em relação ao painel principal.
    *   **Balões de Mensagens:**
        *   Agente/Gerente (Right): Azul elétrico vibrante com gradient sutil (ex: `bg-gradient-to-tr from-indigo-600 to-indigo-500`), sem borda grossa, e um glow leve na cor da própria mensagem.
        *   Cliente (Left): Vidro escuro semi-translúcido (`bg-white/[0.05] border border-white/[0.1] backdrop-blur-md`).
    *   **Microinterações:**
        *   Animação `spring` para entrada de mensagens.
        *   Hover revelando exata data e hora do envio na lateral do balão.
    *   **Tipografia:** Texto nítido (Inter ou outfit se disponível), legibilidade máxima.
*   **Mock Inicial:**
    *   Antes de plugar no banco, renderizaremos 4 mensagens genéricas simulando o cliente perguntando do orçamento e o gerente enviando o link do vídeo, permitindo ao usuário (dono do sistema) visualizar a proposta estética imediatamente.
