# Tasks: Implementação do Chatwoot Sync (002-chatwoot-sync)

Siga estas tarefas ESTRITAMENTE em ordem:

- [ ] **1. Migração de Banco de Dados:**
  - Criar migration (`npx supabase migration new chatwoot_integration`) contendo a criação da tabela `integration_settings` e as colunas extras (`chatwoot_conversation_id`, `chatwoot_contact_id`) na tabela `leads`.
  - Aplicar as RLS Policies na nova tabela `integration_settings`.
  - Gerar e injetar os novos tipos em `types.ts` (ou rodar script correspondente se houver).

- [ ] **2. Adaptação do Contexto (React):**
  - No `AppDataContext.tsx`, adicione a tipagem para `integration_settings`.
  - Crie a função `updateIntegrationSettings` e puxe esses dados no state inicial.

- [ ] **3. Atualização da UI (`Config.tsx`):**
  - Conectar os inputs de "URL do Servidor" e "Token" ao estado global do Supabase.
  - Implementar a função `testConnection` para tentar um fetch simples na URL do Chatwoot validando o token (ou chamando uma edge function de validação).
  - Alterar o UI para exibir o estado verde vivo de "Conectado" caso os dados já estejam salvos e validados.

- [ ] **4. Supabase Edge Function (`chatwoot-webhook`):**
  - Rodar `npx supabase functions new chatwoot-webhook`.
  - Implementar a lógica de parsing no arquivo `index.ts` da função (lendo `event`, `inbox`, `conversation`).
  - Buscar a `unit_id` pelo nome da inbox e o gerente correspondente (buscando manager vinculado àquela unidade).
  - Fazer Insert/Update no banco na tabela `leads`.
  - Retornar `200 OK` para o webhook do Chatwoot.

- [ ] **5. Teste Fim-a-Fim:**
  - Deploy da edge function localmente (`npx supabase functions serve`).
  - Usar cURL para disparar um mock JSON do webhook do Chatwoot para a função.
  - Verificar se a tabela `leads` foi populada e se o Front-end atualizou em tempo real mostrando os leads.
