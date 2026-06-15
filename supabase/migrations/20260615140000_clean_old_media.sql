CREATE OR REPLACE FUNCTION clean_old_media()
RETURNS void AS $$
BEGIN
  -- 1. Libera espaço limpando arquivos pesados
  UPDATE chat_messages
  SET media_url = NULL, media_type = NULL
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND media_url IS NOT NULL;

  -- 2. Limpa os logs de respostas HTTP do Supabase pg_net (maior consumidor de disco)
  -- Como o truncate requer privilégios específicos e a tabela é da extensão,
  -- deletamos os registros velhos pela coluna de data (geralmente 'created' no pg_net).
  -- Caso o pg_net não permita delete direto por causa de locks, TRUNCATE é melhor.
  -- Usamos TRUNCATE pois logs de rede são 100% descartáveis e é garantido esvaziar.
  TRUNCATE net._http_response;
  
  -- 3. Limpa logs de IA antigos
  DELETE FROM public.llm_usage_logs 
  WHERE created_at < NOW() - INTERVAL '7 days';

  -- 4. Limpa task queues antigas
  DELETE FROM public.ai_task_queue 
  WHERE created_at < NOW() - INTERVAL '7 days';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
