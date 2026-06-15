CREATE OR REPLACE FUNCTION clean_old_media()
RETURNS void AS $$
BEGIN
  -- Libera espaço limpando arquivos (base64 ou data_urls grandes) gravados 
  -- como media_url de mensagens com mais de 7 dias
  UPDATE chat_messages
  SET media_url = NULL, media_type = NULL
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND media_url IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
