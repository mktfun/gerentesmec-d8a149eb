# Design Document: Backend & AI Router (016)

## 1. Banco de Dados (Supabase PostgreSQL)

### 1.1 Diagrama Entidade-Relacionamento
A estrutura migra os mocks para SQL tipado:
- **`units`**: `id`, `name`, `created_at`
- **`managers`**: `id`, `name`, `unit_id` (FK), `email`
- **`ai_settings`**: `id` (single row), `provider`, `model`, `api_key` (encrypted/hidden), `features_json`
- **`leads`**: `id`, `customer_name`, `customer_phone`, `unit_id` (FK), `manager_id` (FK), `funnel_stage`, `score`, `ticket_value`, `closing_summary` (text), `created_at`

### 1.2 Segurança e RLS
- Tabelas terão Row Level Security ativado.
- O Frontend autenticado terá permissão de Leitura e Escrita.
- Chaves de API (`ai_settings.api_key`) não devem ser expostas na resposta normal do front-end sem mascarar, idealmente sendo processadas no Backend.

## 2. API / Edge Functions (TypeScript)

### 2.1 `test_ai_capabilities`
- **Input:** Payload JSON com `provider`, `model` e `apiKey`.
- **Lógica:** O script instancia o SDK da OpenAI / Langchain / Fetch via OpenRouter.
- Se o teste de Visão falhar (retorno de erro HTTP 400 por payload de imagem não suportado), a Edge Function faz o catch e formula a mensagem de recomendação ("Considere trocar para...").

### 2.2 `generate_summary`
- Acionada via Webhook interno do Supabase quando um row de `leads` muda o campo `funnel_stage` para `closed_won`.
- Faz um select nas interações prévias (ou simula a leitura do checklist), formata um prompt padrão: *"Atue como um analista comercial de mecânica. Resuma a negociação com o cliente [NOME]. Problema: ... Custo Final: ..."*
- Salva o texto gerado de volta na coluna `closing_summary` do mesmo lead.

## 3. UI / UX Updates
- **AuditPanel:** Adicionar uma aba "Summary" (Resumo Executivo) que aparece automaticamente quando o lead está fechado e o `closing_summary` está preenchido.
- **Configurações:** Criar o painel visual das Recomendações da IA ("Diagnóstico do Motor"). Caixas amarelas e vermelhas mostrando de forma elegante onde o modelo falhou e a sugestão de correção.
