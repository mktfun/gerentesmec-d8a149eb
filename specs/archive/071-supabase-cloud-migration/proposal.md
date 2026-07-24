# Proposal: Migração de Instância Supabase Cloud (071-supabase-cloud-migration)

## Problema
O ambiente atual está dependente de um IP de servidor self-hosted temporário (`http://100.114.251.99:8000`), o que gera inconsistências de acesso externo e impede o funcionamento transparente na nuvem Supabase. É necessário migrar integralmente a estrutura de banco de dados, tabelas, funções, RLS, storage buckets e configurações essenciais para o projeto oficial Supabase Cloud com ID **`ijomsruroyeaapurnbqu`**.

## Solução Proposta
1. **Conexão e Binding**: Conectar silenciosamente a CLI do Supabase usando o token de acesso `<SUPABASE_ACCESS_TOKEN>` e vincular ao projeto `ijomsruroyeaapurnbqu`.
2. **Migração de Schema**: Executar a consolidação e aplicação de todas as migrations DDL (tabelas, tipos ENUM, RPCs, triggers e políticas RLS) presentes no repositório.
3. **Criação de Storage Buckets**: Garantir que os buckets `audits` e `inspections` sejam provisionados com as políticas de acesso apropriadas.
4. **Carga de Dados Essenciais**: Migrar exclusivamente cadastros e dados essenciais de infraestrutura (`units`, `profiles`, `user_roles`, `ai_settings`, `business_hours`), descartando históricos pesados de conversas e logs temporários conforme orientado.
5. **Atualização de Configurações e Client**: Atualizar as variáveis de ambiente em `.env` e no fallback de `src/integrations/supabase/client.ts` com as novas credenciais do projeto Cloud (`https://ijomsruroyeaapurnbqu.supabase.co`).
6. **Validação**: Testar a conectividade da aplicação web e dos endpoints de storage/banco.

## Contratos de Dados
- **Tabelas Principais a Mapear**:
  - Infraestrutura: `units`, `profiles`, `user_roles`, `business_hours`
  - Auditoria & PWA: `store_inspections`, `inspection_items`, `inspection_photos`, `audits`
  - Inteligência / AI: `ai_settings`, `ai_auditor_rag`, `ai_memories`, `weekly_critical_insights`, `llm_usage_logs`
  - CRM & Métricas: `leads`, `chatwoot_metrics`, `task_queue`
- **Buckets de Storage**:
  - `audits` (fotos de vistorias e evidências)
  - `inspections` (fotos de itens de checklist)
- **Filtro de Dados**:
  - **MANTIDOS**: Unidades, perfis de usuários, permissões RBAC, prompts e parâmetros de IA, horários de funcionamento.
  - **DESCARTADOS**: Históricos brutos de conversas temporárias de teste e logs transitórios não essenciais.

## API / Interface
- `VITE_SUPABASE_URL`: `https://ijomsruroyeaapurnbqu.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: Nova chave anônima gerada no painel/CLI Supabase
- `VITE_SUPABASE_SERVICE_ROLE_KEY`: Nova chave de serviço gerada no painel/CLI Supabase
- Arquivo cliente: `src/integrations/supabase/client.ts`

## Features Existentes Impactadas
- `AuditoriaApp` (`/auditoria`): Upload de vistorias e fotos para a nova nuvem.
- `AuditHistory` (`/historico-auditorias`): Leitura de registros do projeto Cloud.
- Dashboards de TV (`/tv/operacional`, `/tv/executivo`): Consulta às tabelas agregadas do novo projeto.
- CRM & Automação: Roteamento de dados para o novo Supabase URL.

## Risco Principal
- **Extensões de Banco de Dados**: A aplicação de migrations contendo a extensão `vector` (pgvector) pode requerer habilitação prévia na nova instância.
- **Mitigação**: O script de DDL deve verificar e criar a extensão `vector` (`CREATE EXTENSION IF NOT EXISTS vector;`) antes de criar tabelas vetoriais de IA.
