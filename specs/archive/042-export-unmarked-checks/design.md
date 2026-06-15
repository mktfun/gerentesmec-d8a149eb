# Design: Filtro de Relatório + Limpeza de Database

## Componentes Frontend

### `src/components/ExportOptionsModal.tsx`
1. Remover slider de score.
2. Adicionar scroll container com checkboxes derivados de `auditStepsConfig`.

### `src/pages/Relatorios.tsx`
1. Atualizar lógica do `leads.filter` no `handleExportPDF` para utilizar os "checks não marcados" e garantir `score !== null`.
2. **Nova Funcionalidade:** Adicionar botão `[ Limpar Mídias Antigas (7 dias+) ]` no cabeçalho ou nas opções da tela de relatórios.
3. Quando o botão for clicado, exibir um Modal de Confirmação (alertando que vídeos/áudios antigos não poderão ser avaliados).
4. Ao confirmar, chamar `supabase.rpc('clean_old_media')`.

## Backend (Supabase)

### RPC: `clean_old_media`
Criaremos uma migração SQL (`supabase/migrations/xxxx_clean_old_media.sql`) para injetar a RPC:
```sql
CREATE OR REPLACE FUNCTION clean_old_media()
RETURNS void AS $$
BEGIN
  -- Libera espaço limpando arquivos base64 gravados como media_url de mensagens com mais de 7 dias
  UPDATE chat_messages
  SET media_url = NULL, media_type = NULL
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND media_url IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
Essa solução limpa imediatamente o peso do Supabase limit.
