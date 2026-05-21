# Design: Chatwoot Rich Media & AI Readiness

## Database Schema (Supabase)
Tabela `chat_messages`:
- [NEW COLUMN] `media_url` (text) - Link direto pro arquivo.
- [NEW COLUMN] `media_type` (varchar) - 'image', 'audio', 'video', 'file'.
- A transcrição de áudio não precisa de nova coluna. Podemos salvar diretamente na coluna `content` atual: `[Áudio Transcrito] <texto aqui>`. Se já tiver conteúdo, apenas apendamos.

## Webhook (`chatwoot-webhook`)
Quando o webhook recebe o payload de mensagem:
- Deve iterar sobre o array `attachments`.
- Se houver anexo, extrai `data_url` e o tipo MIME ou `file_type`.
- Salva o `media_url` e `media_type` no banco junto com a inserção na `chat_messages`.

## AI Audio Transcriber (Nova Edge Function)
- O webhook em si não deve fazer transcrição porque a transcrição de um áudio longo pode demorar e dar Timeout no Webhook do Chatwoot.
- **Solução**: Uma Edge Function chamada `transcribe-audio`. 
- No Supabase, configuramos um Trigger / Webhook de Database: sempre que houver `INSERT` na `chat_messages` com `media_type = 'audio' AND content IS NULL` (ou vazio), disparamos a call assíncrona pra function. Ela baixa, usa OpenAI Whisper e dá um `UPDATE chat_messages SET content = ...`.

## UI/UX (Stitch / React)
Em `ChatHistoryView.tsx`:
- Renderizar uma bolha de chat diferenciada quando houver mídia.
- **Image**: Componente de Imagem com `object-cover`, bordas arredondadas (Liquid Glass style).
- **Audio**: Tag `<audio controls className="h-10" />` estilizada. E logo abaixo, o `content` (que será preenchido aos poucos pela transcrição).
- **Video**: Tag `<video controls />` compacta.
