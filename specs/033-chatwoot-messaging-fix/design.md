# Design: Chatwoot Messaging Type Fix

## Backend
**Edge Function: `chatwoot-webhook`**
O bloco de parsing de eventos de mensagem será refatorado da seguinte forma:
1. Extração segura de `sender.type`:
   ```typescript
   let senderType = payload.sender?.type?.toLowerCase() || message.sender?.type?.toLowerCase();
   ```
2. Avaliação defensiva caso `senderType` seja nulo, lendo o `message_type` de forma Híbrida (Number ou String):
   ```typescript
   const rawMessageType = message.message_type ?? payload.message_type;
   const messageType = Number(rawMessageType);
   
   if (!senderType) {
      if (messageType === 0 || rawMessageType === 'incoming') senderType = 'contact';
      else if (messageType === 1 || messageType === 2 || rawMessageType === 'outgoing' || rawMessageType === 'template') senderType = 'user';
      else senderType = 'bot';
   }
   ```
3. Normalização:
   ```typescript
   if (senderType !== 'contact' && senderType !== 'user' && senderType !== 'bot') {
      senderType = 'bot';
   }
   ```

## Database Migration (Sanitização de Dados)
Precisamos consertar a "sujeira" deixada pelo bug antigo no banco de dados para garantir que os Dossiês voltem a aparecer corretamente.
Como os registros afetados estão salvos com `sender_type = 'bot'`, rodaremos um script em SQL (ou orientaremos o usuário) a fazer um UPDATE limpo nesses registros, convertendo para `user`, já que o erro mais comum foi de fato classificar os envios do gerente como `bot`.

## Frontend
Nenhuma modificação será necessária no `ChatHistoryView.tsx`, pois ele já consome a propriedade `sender_type` da tabela `chat_messages` de forma robusta e reativa:
- `isUser`: renderiza na Direita, com balão Gradiente (Gerente)
- `isContact`: renderiza na Esquerda, com avatar da inicial do nome
- `isBot`/`isSystem`: renderiza na Esquerda com Wrench Icon / Centralizado verde.
