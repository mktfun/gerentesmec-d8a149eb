# Proposal: Sincronização e Auditoria Retroativa

## 1. O que vamos construir?
Um **Agente Node.js Local** (Script cli) executado pelo próprio Antigravity (ou acionado via um endpoint simples). Este agente varrerá as conversas antigas do Chatwoot e usará a API Multimodal do Gemini 1.5 Pro para recalcular todas as notas como se tivesse acompanhado a conversa desde o início.

## 2. Escopo do Agente
- Conectar no banco de dados Supabase e listar os Leads que não possuem uma pontuação validada (ou que têm pontuação 0 mas muitas mensagens).
- Bater na API do Chatwoot (`/api/v1/accounts/1/conversations/{id}/messages`).
- Processar os Anexos:
  - Fazer o download local/temporário de áudios, imagens e vídeos.
  - Fazer o upload desses arquivos para a nuvem do Google AI (usando `@google/genai` File API) e obter as referências multimodais.
- Montar um Super-Prompt contendo:
  - A transcrição literal do chat (Cliente: X, Gerente: Y).
  - Referências injetadas para as mídias nos momentos exatos em que foram enviadas.
  - As regras estritas de checklist (as mesmas definidas no spec 006).
- Salvar os dados processados (Score, Funnel Stage, Audit Reasons) na tabela `leads` no Supabase e na `chat_messages` (resumos multimodais das mensagens).

## 3. BDD Scenarios

### Cenário: Sincronização de Lead Antigo Parado no Meio
- **Given (Dado):** O sistema possui um lead criado há 3 dias com a etapa `negotiation` e score `0`, mas que já trocou mais de 20 mensagens com o gerente no Chatwoot (incluindo áudios e vídeos).
- **When (Quando):** O agente de sincronização histórica for disparado para este `lead_id`.
- **Then (Então):** A conversa será baixada, vídeos/áudios analisados, e a IA recalculará a etapa do funil (ex: para `quote` caso o orçamento tenha sido enviado) e atribuirá um checklist reconstruído, sem causar timeout na plataforma.
