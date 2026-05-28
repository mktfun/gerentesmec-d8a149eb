# Design e Integrações: 010-ai-ensemble-telemetry

## Abordagem de Banco de Dados (Supabase)
Tabela Alvo: `llm_usage_logs`
- A tabela já possui as colunas `input_text` e `output_text`. 
- Na Edge Function `ai-autonomous-evaluator`, a instrução `await supabaseClient.from('llm_usage_logs').insert(...)` será ajustada para injetar o conteúdo das variáveis `prompt` (como `input_text`) e `llmOutputText` (como `output_text`).

## Arquitetura de UI (Stitch MCP - Conceitual)
Componente Alvo: `AdvancedAiPanel.tsx` -> seção "Histórico de Telemetria de LLM".
- **Botão SUCESSO Expandível**: Assim como existe um botão ou modal "Ver Erro" (que abre a mensagem de erro), criaremos um botão "Ver Detalhes" para todas as entradas de sucesso.
- O modal deve renderizar o Input (Prompt longo) em um contêiner scrollable, bem como o Output (JSON ou markdown resultante) para facilitar o debug pelo administrador.

## Ajustes da Edge Function (`ai-autonomous-evaluator/index.ts`)
1. **Limpeza do Logging de Fallback**: O loop implementado anteriormente será refinado. Ele tentará as requisições, porém NÃO fará chamadas `.insert` na tabela de logs a cada iteração (se é isso que estava acontecendo em outras áreas do código ou falhas que passavam batido). Ele armazenará o erro em uma variável local e fará um `throw` apenas se todos os fallbacks falharem.
2. **Nomeação Semântica**: O modelo armazenado no log não será o `finalModel` da requisição crua (ex: `gemini-1.5-flash`), mas sim uma versão envelopada (ex: `Ensemble: Gemini 3.5 Flash (Scoring)`) refletindo o que foi exposto na UI se `aiSettings.model` estiver ativado para Auto-Routing.
