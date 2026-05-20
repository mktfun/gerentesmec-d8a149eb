# Tasks: WhatsApp Monitoring Playbook

## Fase 1: Setup do Supabase & Migrações (Supabase MCP)
- [ ] Criar arquivo de migração para inicializar a estrutura no projeto Supabase `qtjitszradxsmnilnqtj`.
- [ ] Tabelas a criar: `units`, `managers`, `whatsapp_cycles`, `cycle_steps`, `google_reviews_log`.
- [ ] Criar a tabela silenciosa `system_settings` para armazenar o Token da API do Chatwoot e ID da conta de forma mascarada.
- [ ] Configurar políticas RLS (Row Level Security) para garantir privacidade dos gerentes e controle total para o Monitor (David).
- [ ] Sincronizar tipos com o projeto local: `supabase gen types typescript --local`.

## Fase 2: Configuração Discreta & Conexão Chatwoot
- [ ] Implementar a página oculta de configurações (`/config` ou aba invisível em Ajustes) para David inserir silenciosamente as credenciais da API do Chatwoot.
- [ ] Criar a Edge Function `/supabase/functions/chatwoot-sync` para se conectar à API do Chatwoot e buscar mensagens periodicamente.
- [ ] Desenvolver a lógica de processamento de regras para marcar automaticamente o compliance das 4 etapas e o tempo de resposta máximo de 20 minutos.

## Fase 3: Módulo de Cadastro (Unidades & Gerentes)
- [ ] Criar tela de cadastro minimalista (CRUD) para Unidades.
- [ ] Criar formulário para registro de Gerentes, permitindo selecionar em qual unidade ele atua e adicionar seu ID de caixa de entrada do Chatwoot (`chatwoot_inbox_id`).
- [ ] Garantir validação dos formulários com `zod` e `react-hook-form`.

## Fase 4: Dashboard Minimalista (Estilo ConciliaMec)
- [ ] Desenvolver Layout de Dashboard limpo (`/monitoramento`) com paleta baseada no ConciliaMec.
- [ ] Desenvolver Card Superior de **Geral Compliance %** e **Furos de Compliance** (etapa falha ou tempo excedido).
- [ ] Desenvolver **Motor de Monitoramento** (Tabela principal com paginação contendo a listagem de atendimentos auditados, o status de cada etapa por ícones interativos e furos destacados).
- [ ] Criar filtros rápidos por Unidade (ex: "Jabaquara", "Kennedy", "Dom Pedro") e por Gerente.
- [ ] Exibir o painel de **Rastreabilidade Google Reviews** cruzando a Etapa 4 enviada vs avaliações reais.

## Fase 5: Testes & Validação dos Scenarios BDD
- [ ] Testar importação e processamento via API do Chatwoot.
- [ ] Validar BDD Scenario 1: Ciclo completo com 100% de sucesso.
- [ ] Validar BDD Scenario 2: Alerta de falha na Etapa 2 (envio de vídeos).
- [ ] Validar BDD Scenario 3: Discrepâncias de reviews do Google.
