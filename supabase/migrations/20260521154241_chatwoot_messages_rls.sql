ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for chat_messages" ON public.chat_messages FOR ALL USING (true);
