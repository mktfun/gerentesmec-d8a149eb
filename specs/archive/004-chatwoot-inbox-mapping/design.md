# Design: Mapeamento de Inboxes do Chatwoot

## UX/UI Design (Frontend)
Na página de `Config.tsx`, a aba "Unidades e Canais" passará por um redesign funcional:
- Adicionaremos uma "Seção de Inboxes" que puxa dados direto do Chatwoot usando o URL e Token em memória (através do novo Edge Function proxy).
- Em vez do Administrador "digitar" o nome da Unidade torcendo para bater com o nome lá do Chatwoot, ele vai ver um Card para cada Inbox encontrado no Chatwoot (ex: WhatsApp Dom Pedro).
- Dentro de cada Card de Inbox, haverá um Dropdown listando as Unidades (Units) cadastradas no sistema.
- Se ele não tiver unidades criadas, poderá criar uma Nova Unidade diretamente associada àquele inbox.

## Backend (Supabase)
### Banco de Dados (SQL)
- Nova coluna na tabela `units`: `chatwoot_inbox_id integer unique`.

### Edge Functions
#### 1. `chatwoot-inboxes` (Proxy)
- Método `POST`. Recebe `{ "chatwoot_url": "...", "chatwoot_token": "..." }`.
- Faz `GET profile` -> Extrai `account_id` -> Faz `GET inboxes`.
- Retorna JSON seguro apenas com os Inboxes (ID, name, channel_type).

#### 2. `chatwoot-webhook` (Modificado)
- Antes procurava: `units.find(u => u.name === inbox.name)`.
- Agora procurará: `units.find(u => u.chatwoot_inbox_id === inbox.id)`. (Apenas no Supabase via SQL `eq('chatwoot_inbox_id', inboxId)`). Isso blinda o painel de erros 100%.
