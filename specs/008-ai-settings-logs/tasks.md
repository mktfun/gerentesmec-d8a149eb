# Tasks - Feature 008

## Fase 1: Supabase & Configuração Inicial
- [x] Criar arquivo de migração: `supabase/migrations/20260528120000_llm_usage_logs_v2.sql`.
- [x] Atualizar tipagens em `src/integrations/supabase/types.ts` ou manualmente nas interfaces para suportar `input_text`, `output_text` e `tokens_limit_remaining`.
- [x] Arrumar a lógica de Update: No arquivo `src/context/AppDataContext.tsx`, garantir que `updateAiSettings` fará INSERT se o registro não existir e atualizará o estado local (`setAiSettings`) otimisticamente.

## Fase 2: Ocultação & UI de Modelos
- [x] Em `src/pages/Config.tsx`, remover o `<AiRouterConfig />` do fluxo principal.
- [x] Em `src/components/Config/AdvancedAiPanel.tsx`, importar e renderizar o `<AiRouterConfig />` em um modal de tela inteira ou um drawer bem largo, garantindo que o gerente só veja isso se acessar pela área restrita (Acesso de Engenharia).
- [x] Em `src/components/Config/AiRouterConfig.tsx`, adicionar ao dicionário `availableModels` as entradas: `gemini-2.5-flash`, `gemini-2.5-flash-8b`, `gemma-2`, `gemma-3`.

## Fase 3: Telemetria Premium de Logs
- [x] No arquivo `src/components/Config/ProviderMonitoring.tsx`, alterar o fetch de logs para trazer `input_text`, `output_text` e `tokens_limit_remaining`.
- [x] Adicionar botão "Ver Detalhes" para logs de `SUCESSO` (assim como existe "Ver Erro").
- [x] Construir o modal `LogDetailsModal` exibindo o Prompt (Input) e a Resposta crua em abas ou visualização paralela (Liquid Glass).
- [x] Testar salvamento da Provider, verificar optimistic update na UI.
- [x] Fazer commit do resultado.
