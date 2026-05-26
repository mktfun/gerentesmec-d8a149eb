# Tasks: LLM Monitoring Dashboard

## 1. Banco de Dados (Supabase)
- [x] Criar arquivo de migração `supabase/migrations/XXXXXXXXXXXXXX_llm_usage_logs.sql`.
- [x] Criar a tabela `llm_usage_logs` e os devidos indexadores por data.
- [x] Atualizar as definições de tipo no frontend (`src/integrations/supabase/types.ts` ou rodar codegen).

## 2. Backend (Edge Function)
- [x] Atualizar `supabase/functions/ai-autonomous-evaluator/index.ts`.
- [x] Adicionar medição de latência via `performance.now()`.
- [x] Adicionar blocos `try/catch` rigorosos.
- [x] Em caso de erro, inserir log na tabela `llm_usage_logs` com status de error e a mensagem original da provedora.
- [x] Em caso de sucesso, inserir log de sucesso com o provider, modelo, tokens (se a API retornar) e tempo.

## 3. Frontend (Dashboard Visual)
- [x] Criar um novo contexto/hook no React ou usar um simples `useEffect` no modal de Configurações para realizar fetch nos logs (apenas os logs das últimas 24h e um COUNT geral da conta).
- [x] Criar o subcomponente `ProviderMonitoring.tsx`.
- [x] Implementar a lógica visual que ajusta a paleta de cores (CSS Variables HSL) dependendo da marca da IA selecionada.
- [x] Adicionar gráficos de donut usando `recharts` ou barras de progresso lineares.
- [x] Renderizar a lista tabular (tabela de histórico) exibindo sucesso, tempo de resposta e botão de ver detalhes do erro.

## 4. Validação
- [x] Testar falhas forçadas (ex: errar a API Key de propósito) e confirmar se a Edge Function retorna a resposta formatada sem crashar, inserindo no DB.
- [x] Ver na interface o log subindo dinamicamente.
