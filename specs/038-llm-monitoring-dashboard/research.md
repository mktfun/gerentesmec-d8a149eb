# Research: LLM Monitoring & Analytics Dashboard

## Contexto
O usuário solicitou um painel de monitoramento detalhado do uso das APIs de inteligência artificial na plataforma. Devido ao uso de múltiplos provedores (OpenAI, Google AI Studio, Anthropic, NVIDIA NIM, Google Vertex AI), tornou-se crítico visualizar limites de requisições, sucessos, falhas e histórico de forma granular.

## Referências de Mercado
1. **Google Cloud Console (APIs & Services)**: Apresenta gráficos de tráfego (Requests per second), taxa de erro (Error rate) e latência.
2. **OpenAI Platform Dashboard**: Foca na distribuição de tokens gastos por modelo e exibição de limites (Rate Limits) para RPM (Requests Per Minute), RPD (Requests Per Day) e TPM (Tokens Per Minute).
3. **LangSmith / Helicone**: Plataformas dedicadas a LLM Observability. Mostram custo, latência e logs exatos das requisições.

## Requisitos Levantados
- **Tracking Base:** Salvar cada interação da Edge Function com a API do LLM.
- **Gráficos e Indicadores:**
  - Contagem de chamadas (Sucesso vs Erro).
  - Limites de uso vs uso atual (Ex: 10/15 RPM).
  - Visualização de logs de requisição detalhados (exibindo motivos de erro).
- **Apresentação (Branding):**
  - Cada provider deve ter uma assinatura visual distinta no dashboard.
  - OpenAI: Verde (#10a37f) e Preto.
  - Google: Azul (#4285F4), Vermelho, Amarelo e Verde (ou paleta Material 3).
  - Anthropic: Pêssego/Creme e Preto.
  - NVIDIA NIM: Verde Neon (#76B900) e Preto.
  - Vertex AI: Azul escuro (#1a73e8).

## Arquitetura de Dados (Supabase)
Precisaremos de uma tabela de logs (ex: `llm_usage_logs`) para armazenar:
- `id` (uuid)
- `created_at` (timestamp)
- `provider` (text)
- `model` (text)
- `status` (text: 'success' | 'error')
- `error_message` (text, opcional)
- `latency_ms` (integer, opcional)

Os limites podem ser armazenados como configurações na tabela `ai_settings` (jsonb) ou hardcoded no frontend caso sejam puramente visuais e baseados no Free-Tier.

## Modificações Necessárias na Edge Function
A função `ai-autonomous-evaluator` precisará englobar as chamadas `fetch` do LLM em blocos `try/catch` que meçam o tempo gasto (`performance.now()`) e loguem no banco antes de retornar o resultado ou propagar o erro.

## Design e UX (ux-ui-architect-2026)
- **Efeito Liquid Glass:** Cards dos provedores com fundo semitransparente usando as cores da marca.
- **Gráficos:** Recharts ou Visx. Gráficos de barras para o volume e gráficos de rosca (donut) para sucessos/falhas. Barras de progresso com animação para representar os limites (RPM / RPD).
