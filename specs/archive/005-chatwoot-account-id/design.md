# Design: Chatwoot Account ID & URL Sanitization

## Visão Geral da Solução
Esta alteração visa resolver o erro de `Invalid URL` causado pela falta do protocolo `https://` nas URLs de Chatwoot salvas pelo usuário, e também eliminar a dependência frágil do endpoint `/api/v1/profile` para adivinhar o ID da conta. Permitiremos que o administrador insira o `Account ID` diretamente nas configurações e usaremos essa informação para bater cirurgicamente na API de Caixas de Entrada (Inboxes).

## 1. Banco de Dados (Supabase)
### Novas Estruturas (Migrações)
*   **Tabela `integration_settings`**:
    *   Nova coluna: `chatwoot_account_id` (integer, opcional/nullable).
    *   O SQL será disponibilizado para execução no **SQL Editor** do Supabase Dashboard (e salvo em uma migração física para rastreabilidade).

```sql
-- Migration: 20260521131435_chatwoot_account_id.sql
ALTER TABLE public.integration_settings 
ADD COLUMN chatwoot_account_id integer;
```

## 2. Supabase Edge Function (`chatwoot-inboxes`)
*   **Sanitização da URL**:
    *   Verificar se a URL fornecida possui prefixo `http://` ou `https://`.
    *   Caso não possua, adicionar `https://` automaticamente.
    *   Remover barras finais (`/`).
*   **Ignorar Profile Endpoint**:
    *   Verificar se `chatwoot_account_id` foi enviado no payload.
    *   Caso exista, pular a requisição de `/api/v1/profile` e usar o ID diretamente.
    *   Caso não exista, fazer o fallback (chamando o profile com a URL sanitizada) para manter retrocompatibilidade.

## 3. User Interface (React)
### Configurações (`src/pages/Config.tsx`)
*   **Estado e Inputs**:
    *   Adicionar campo numérico `"Account ID"` (ex: `1`) na seção **Integração de Canal**.
    *   Carregar `chatwoot_account_id` da tabela `integration_settings`.
*   **Sanitização da URL no Frontend**:
    *   Adicionar sanitização automática de URL antes de testar ou salvar (garantindo o prefixo `https://`).
*   **Novo fluxo de Teste de Conexão**:
    *   Chamar a Edge Function `chatwoot-inboxes` passando a URL, Token e Account ID para testar, em vez de fazer fetch direto do navegador (o que contorna quaisquer problemas de CORS locais).
    *   Se a Edge Function retornar com sucesso, salvar as configurações no Supabase.

### Caixas de Entrada (`src/components/Config/InboxMappingPanel.tsx`)
*   Passar o `chatwoot_account_id` obtido das configurações no payload da requisição para a Edge Function.
