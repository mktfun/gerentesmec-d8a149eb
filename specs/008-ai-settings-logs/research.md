# RPI-R: Pesquisa e Contexto (Feature 008)

## 1. Mapeamento do Código Atual
- **Salvar Configurações (Bug)**: No arquivo `AppDataContext.tsx`, a função `updateAiSettings` faz um "early return" caso `aiSettings?.id` seja nulo. Se a tabela `ai_settings` estiver vazia no Supabase, a UI tentará atualizar e falhará silenciosamente. Além disso, falta a atualização otimista (optimistic update) no React State.
- **Modelos Gratuitos**: No arquivo `AiRouterConfig.tsx`, a lista `availableModels` não possui algumas das opções explícitas requisitadas pelo usuário (ex: `gemini-2.5-flash` puro, `gemma-2` ou `gemma-3` puro fora do OpenRouter).
- **Logs Detalhados**: O banco de dados atual tem a tabela `llm_usage_logs` com `tokens_used` e `error_message`, mas não salva o `input` enviado nem o `output` detalhado da inteligência artificial.
- **Acesso de Engenharia**: No arquivo `Config.tsx`, o painel `<AiRouterConfig />` está sendo renderizado abertamente na tela principal, e o "Acesso de Engenharia" (que abre `<AdvancedAiPanel />`) está apenas como um Easter Egg inútil no final da página.

## 2. Necessidades de Negócio & Feedback
- A avaliação de leads deve parecer "mágica" ou "humana" para os operadores, de modo que toda a configuração de inteligência artificial (Modelos, Prompts, Telemetria) fique oculta atrás do painel "Acesso de Engenharia".
- Os engenheiros precisam de tracking completo: saber exatamente o que a IA recebeu (input), como ela pensou (output/formatação) e quantos tokens gastou/restam para debugarem as "alucinações" ou erros.

## 3. Lacunas para Adaptação
- Criar migração SQL para alterar a tabela `llm_usage_logs` adicionando as colunas `input_text`, `output_text` e `tokens_limit_remaining`.
- Refatorar `<AiRouterConfig />` para dentro de `<AdvancedAiPanel />`.
- Refatorar a UI de `ProviderMonitoring.tsx` para permitir que o usuário clique em um log de "SUCESSO" e visualize os detalhes profundos (Input/Output).
- Adicionar os modelos do Gemini solicitados à lista de seleção.
