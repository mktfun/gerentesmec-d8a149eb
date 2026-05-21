# Tasks: 003-ai-edge-cases

## 1. Tratamento de Dados DB
- [x] Fornecer comando SQL manual para ativar `pgvector` e evitar falhas no Cache Semântico.
- [x] Adicionar coluna `ai_feedback` do tipo `text` na tabela `leads`.
- [x] Adicionar colunas `media_url` e `media_type` na tabela `chat_messages` (se não existirem com a tipagem correta).

## 2. Refatoração do Backend
- [x] Alterar o `chatwoot-webhook/index.ts` para capturar os attachments (anexos) do payload e mapeá-los como texto formatado `[ANEXO: video/mp4]`.
- [x] Alterar a chamada do `ai-autonomous-evaluator` para operar com lógica de atraso/debounce, agregando mensagens em lote (Batch Processing).
- [x] Garantir validação estrita do JSON retornado pela IA para evitar quebra no cast de inteiros/floats.

## 3. Ajuste de UI (Feedback da IA)
- [x] Atualizar `AuditPanel.tsx` para buscar e exibir a coluna `ai_feedback` (o `motivo` gerado pela IA) usando o design *Apple Liquid Glass*.
- [x] Ocultar o checklist interativo no `AuditPanel` se `auto_scoring` estiver ativado (pois a IA toma conta, o usuário só deve visualizar).
