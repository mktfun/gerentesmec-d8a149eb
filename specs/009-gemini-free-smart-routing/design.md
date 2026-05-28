# Design: Feature 009 - Gemini Free Tier Smart Routing

## UI / UX
- **AiRouterConfig**: Na dropdown de Modelos, quando `provider` for "Google", adicionaremos a opção `Gemini Free-Tier Ensemble (Auto-Routing)`.
- Quando este modelo for selecionado, a UI mostrará um badge ou banner (ex: usando `lucide-react` com ícone de `Network` ou `Layers`) indicando que o Roteamento Inteligente com Fallbacks está ativado (assim como acontece quando "NVIDIA NIM" está selecionado).
- Nenhum novo modal ou visual pesado precisa ser criado na UI, pois a lógica de roteamento em si vive no backend.

## Arquitetura de Dados (Supabase / Backend)
O frontend salvará em `ai_settings.model` a string `"gemini-free-ensemble"`.

A aplicação que lida com o LLM (seja no cliente ou nas Edge Functions/Backend) lerá esse modelo. Se for `"gemini-free-ensemble"`, não fará chamadas diretamente. Em vez disso, usará uma tabela de roteamento Hardcoded (já que é específica para a API gratuita do Google).

Exemplo estrutural a ser implementado futuramente ou no código do app:
```typescript
const ROUTING_TABLE = {
  scoring: ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3-flash'],
  pipeline: ['gemma-4-31b', 'gemma-4-26b', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite'],
  vision: ['gemini-2.5-flash', 'gemini-3.5-flash'],
  audio: ['gemini-2.5-flash-tts'],
  embedding: ['gemini-embedding-1']
};
```
O utilitário de chamada ao LLM tentará o primeiro índice da array respectiva à tarefa atual. Se capturar o código HTTP `429` (Rate Limit) ou `503`, tentará o próximo da array. Se esgotar a array, aí sim lança o erro final.

## Compatibilidade Visual 2026
Na UI de "Acesso de Engenharia", a opção "Gemini Free-Tier Ensemble" pode ter um estilo levemente diferente no Dropdown ou mostrar um resumo visual das divisões (Tabela de RPM) para o usuário se sentir seguro sobre a arquitetura distribuída.
