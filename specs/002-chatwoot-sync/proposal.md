# Proposal: Sincronização Chatwoot -> GerentesMec (002-chatwoot-sync)

## Requisitos
1. **Autenticação:** O sistema deve armazenar as credenciais do Chatwoot (URL da API e Access Token) em segurança no Supabase.
2. **Recepção de Webhooks:** O Supabase deve fornecer uma Edge Function (`chatwoot-webhook`) capaz de receber eventos HTTP POST originados do Chatwoot.
3. **Mapeamento de Unidades:** O webhook deve identificar a qual Unidade a conversa pertence cruzando `payload.inbox.name` com `units.name` (case insensitive).
4. **Criação de Leads:** Se uma conversa for iniciada (ou uma mensagem recebida de uma conversa não rastreada), um Lead deve ser criado na tabela `leads` referenciando a unidade correspondente e o gerente responsável.
5. **Atualização em Tempo Real:** As atualizações do webhook devem alterar o `last_message_at` da tabela `leads` para que o frontend atualize instantaneamente via Supabase Realtime.

## BDD Scenarios

### Cenário: Recebendo o primeiro contato de um novo cliente
- **Given (Dado):** Que a integração com Chatwoot está configurada e a unidade "Dom Pedro" está mapeada.
- **When (Quando):** O webhook do Chatwoot envia o evento `conversation_created` com `inbox.name = "Dom Pedro"` e `contact.name = "João Silva"`.
- **Then (Então):** A Edge Function cria um registro em `leads` vinculando à unidade "Dom Pedro" e preenche os dados do cliente (João Silva). O `funnel_stage` é marcado como `lead_new`.

### Cenário: Recebendo mensagem em unidade não mapeada
- **Given (Dado):** Que a unidade "Vila Mariana" NÃO está mapeada na tabela `units`.
- **When (Quando):** O webhook envia um evento vindo do inbox "Vila Mariana".
- **Then (Então):** A Edge Function loga o evento como aviso ("Unmapped unit") e NÃO cria um lead fantasma, evitando poluir o dashboard com dados órfãos.

### Cenário: Configuração de Integração via Frontend
- **Given (Dado):** O usuário está na tela de `Config.tsx`.
- **When (Quando):** Ele insere a URL "https://app.chatwoot.com" e o Token e clica em Salvar.
- **Then (Então):** Os dados são gravados na tabela `system_settings` no Supabase e a UI mostra "Conectado".
