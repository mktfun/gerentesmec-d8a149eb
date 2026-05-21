# Chatwoot & Supabase Integration Research

## 1. Contexto Atual
O CRM GerentesMec exibe dados de leads, gerentes e scores, mas até agora tudo operava sob dados estáticos ou inserções manuais. O arquivo `src/pages/Config.tsx` já possui a interface para receber:
- URL do Servidor Chatwoot
- Token de Acesso da API

O banco de dados (Supabase) não possui tabelas ou colunas prontas para armazenar essas credenciais de integração. A tabela `units` tem apenas `id` e `name`, e as conversas do Chatwoot precisarão ser cruzadas com as unidades verificando o `inbox.name`.

## 2. Necessidades de Backend
- Precisamos de uma tabela `system_config` (ou expandir `ai_settings` para `integration_settings`) para armazenar o `chatwoot_url` e `chatwoot_access_token`.
- Precisamos de uma **Edge Function** no Supabase chamada `chatwoot-webhook` que vai receber os eventos do Chatwoot (ex: `conversation_created`, `message_created`, `conversation_updated`).
- O payload do webhook do Chatwoot inclui:
  - `event`: Tipo de evento (ex: `message_created`)
  - `conversation`: Informações da conversa (status, inbox_id, etc)
  - `contact`: Dados do cliente (nome, telefone, email)
  - `inbox`: Dados da caixa de entrada (usaremos `inbox.name` para bater com `units.name`).

## 3. O Fluxo Proposto
1. O usuário salva as credenciais do Chatwoot no frontend (`Config.tsx`).
2. O sistema salva isso no banco (nova migração necessária).
3. O Chatwoot é configurado para disparar um Webhook para a URL da Edge Function do Supabase sempre que houver novas mensagens.
4. A Edge Function recebe o Webhook:
   - Extrai o `inbox.name`.
   - Busca a unidade no banco `SELECT id FROM units WHERE lower(name) = lower(inbox_name)`. Se não achar, ignora ou cria (pela regra de negócio, a unidade deve bater).
   - Verifica se a conversa (`conversation.id`) já existe como um `lead` no Supabase (precisaremos de uma coluna `chatwoot_conversation_id` em `leads`). Se não existir, cria o lead inicial (`funnel_stage = 'lead_new'`).
   - Salva a mensagem ou atualiza o `last_message_at`.
   - Se a mensagem for do contato, aciona a IA (via Hermes Router configurado) para avaliar o ticket_value, preencher informações (ex: veículo) e calcular o score se a conversa for fechada.

## 4. O que precisa mudar no BD (Schema)
- Tabela `leads`: adicionar coluna `chatwoot_conversation_id` (integer, unique) e `chatwoot_contact_id` (integer).
- Tabela `system_settings` (nova): Para guardar URL e Token do Chatwoot e webhook secret.
