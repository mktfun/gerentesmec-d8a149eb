-- Make chatwoot_message_id nullable so we can insert local system logs
ALTER TABLE public.chat_messages ALTER COLUMN chatwoot_message_id DROP NOT NULL;

-- Drop the old constraint
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_type_check;

-- Add the new constraint allowing 'system'
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_sender_type_check CHECK (sender_type IN ('contact', 'user', 'bot', 'system'));
