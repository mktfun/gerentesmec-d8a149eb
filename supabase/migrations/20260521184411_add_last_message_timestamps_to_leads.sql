ALTER TABLE public.leads 
ADD COLUMN last_client_message_at timestamp with time zone,
ADD COLUMN last_agent_message_at timestamp with time zone;
