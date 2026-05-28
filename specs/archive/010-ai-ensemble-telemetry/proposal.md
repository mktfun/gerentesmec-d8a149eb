# Projeto: 010-ai-ensemble-telemetry

## Requisitos
1. **Roteamento Visual & Real na Edge Function**: A Edge Function `ai-autonomous-evaluator` não deve registrar no banco que utilizou genéricamente o `gemini-1.5-flash` ou `gemini-2.5-flash` quando o usuário optou pelo roteamento gratuito. Ela deve registrar o nome da arquitetura ou a função exata ("Gemini Free-Tier Ensemble" ou "Gemini 3.5 Flash (Scoring)") que processou a requisição.
2. **Fallback Sem Erros Falsos**: Apenas o status final (Sucesso após fallback ou Erro Total) deve ser retornado ao frontend/telemetria para evitar a poluição de logs (onde um fallback exibe sucesso e, em seguida, um erro secundário aparece). Se um fallback falhar mas o próximo passar, deve registrar o log como sucesso, usando o nome do ensemble configurado.
3. **Persistência de Prompts e Respostas**: As queries enviadas pela Edge Function (Prompt) e os outputs (Respostas, Thinking) precisam ser devidamente salvos nas colunas `input_text` e `output_text` na tabela `llm_usage_logs` em casos de sucesso e de falha.
4. **Visão de Detalhes no Frontend**: O frontend (`AdvancedAiPanel.tsx`) deve permitir que logs marcados como "SUCESSO" possam ser abertos e inspecionados (ver Input, Output e Tokens) assim como atualmente ocorre com a visualização de erros ("Ver Erro").

## User Stories
- **Como Engenheiro AI**, eu quero ver no log de telemetria exatamente qual modelo do meu painel "Ensemble" rodou (ex: Gemma 4 31B), em vez de uma string genérica do backend.
- **Como Administrador**, eu quero poder clicar em um log com SUCESSO para ver qual prompt exato foi enviado e o que o modelo respondeu, para calibrar meus prompts sem precisar advinhar.
- **Como Sistema**, ao enfrentar um Rate Limit no Google AI Studio, eu quero alternar para o modelo reserva sem disparar um log prematuro de ERRO, registrando sucesso caso a tentativa secundária funcione.

## BDD Scenarios

### Cenário: Exibindo logs de sucesso com riqueza de detalhes
- **Given (Dado):** O Administrador acessou a tela de Engenharia AI e o sistema registrou chamadas bem-sucedidas.
- **When (Quando):** Ele clica na linha que contém o status "SUCESSO".
- **Then (Então):** Um modal deve abrir mostrando o `input_text` (prompt enviado), `output_text` (resposta recebida) e a quantidade exata de Tokens.

### Cenário: Roteamento Auto-Gerenciado respeitando os nomes do painel
- **Given (Dado):** O usuário salvou a opção "Gemini Free-Tier Ensemble (Auto-Routing)".
- **When (Quando):** Uma avaliação autônoma é processada pela Edge Function.
- **Then (Então):** A Edge Function deve acionar o fallback sob o capô (ex: `gemma-2-27b-it`), mas registrar em `llm_usage_logs` o provedor como "Google" e o modelo como "Gemini Free-Tier Ensemble" (ou o alias "Gemini 3.5 Flash (Scoring)").

### Cenário: Tentativas de Fallback invisíveis em caso de sucesso
- **Given (Dado):** A requisição primária atinge o limite do Google AI Studio.
- **When (Quando):** A Edge Function silenciosamente faz uma segunda requisição em um modelo fallback e tem sucesso.
- **Then (Então):** Nenhum log de erro deve aparecer na Telemetria; apenas o log definitivo de SUCESSO.
