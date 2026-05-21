ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type varchar(50);
