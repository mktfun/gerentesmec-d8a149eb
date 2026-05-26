# Research: Chatwoot Rich Media & AI Readiness

## Contexto e Desafio
Atualmente, o nosso webhook (`chatwoot-webhook`) e nossa UI de histórico (`ChatHistoryView.tsx`) lidam muito bem com **Texto**. No entanto, numa operação de Mecânica Automotiva, o envio de mídia é fundamental:
- Clientes enviam fotos da peça quebrada ou vídeos do barulho do motor.
- Gerentes enviam áudios longos explicando o orçamento.

O usuário deseja:
1. Visualizar imagens, áudios e vídeos diretamente na UI do CRM.
2. Armazenar esses dados de uma forma "Inteligente para IA", permitindo que o robô de Auditoria consiga "ver" as imagens e "escutar" os áudios.

## Como o Chatwoot entrega Mídia
Quando um anexo é enviado, o webhook payload do evento `message_created` contém o array `attachments`:
```json
"attachments": [
  {
    "id": 123,
    "message_id": 456,
    "file_type": "image", // ou "audio", "video", "file"
    "account_id": 1,
    "data_url": "https://chat.tork.services/rails/active_storage/blobs/...",
    "thumb_url": "..."
  }
]
```

## Readiness para a Inteligência Artificial (AI Auditor)
Para que a IA audite os leads perfeitamente:
1. **Imagens**: Modelos como `gpt-4o` são multimodais. Se a IA auditora receber o `data_url` da imagem junto ao texto do prompt, ela consegue "ver" a imagem e entender o contexto (ex: "Aqui está a foto da suspensão vazando").
2. **Vídeos**: O GPT-4o ainda tem limitações com vídeos diretos via API padrão de Chat, mas o armazenamento do link é útil para o gerente humano.
3. **Áudios (Crucial)**: Áudios são caixas pretas para a LLM padrão. Para que a IA Auditora avalie a qualidade de um orçamento enviado por áudio, **precisamos transcrever**.
   - **Solução**: Uma Edge Function pode "escutar" inserções na tabela `chat_messages` que contenham `file_type = 'audio'`. Ela faz o download do áudio, envia para a API do OpenAI Whisper (Speech-to-Text) e salva o texto na coluna `content` com o prefixo `[🎙️ Áudio Transcrito]: O motor parece que...`. Assim, a IA Auditora (que lê texto) terá o contexto 100% legível!

## Conclusão da Pesquisa
Precisamos evoluir a tabela `chat_messages`, o webhook receiver, a UI e implementar uma rotina de transcrição de áudios (Whisper).
