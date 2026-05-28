# Tasks: Feature 009 - Gemini Free Tier Smart Routing

## 1. UI (AiRouterConfig)
- [x] Adicionar `"Gemini Free-Tier Ensemble (Auto-Routing)"` como primeira opção no array do provedor `'Google'` em `AiRouterConfig.tsx`.
- [x] Quando `model === 'Gemini Free-Tier Ensemble (Auto-Routing)'`, exibir um painel visual abaixo do seletor explicando o Roteamento de Modelos por Categoria (Auditoria, Auto-Pipeline, Embeddings, etc) de forma similar ao visual do "NVIDIA Auto-Ensemble", com um botão de "Ver Tabela Completa" que abra os limites de RPM e falhas.
- [x] Adicionar os limites documentados pelo usuário (ex: Gemma 4 31B = 15 RPM, Gemini 3.5 Flash = 5 RPM) em uma tabelinha expansível para informar os engenheiros da inteligência do sistema.

## 2. Lógica Base do Cliente
- [x] Criar o utilitário `/src/utils/aiRouterUtils.ts` (ou algo similar caso não exista) com a definição do tipo `ROUTING_TABLE` contendo as Arrays de fallbacks para:
  - `scoring`: `['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3-flash']`
  - `pipeline`: `['gemma-4-31b', 'gemma-4-26b', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite']`
  - `vision`: `['gemini-2.5-flash', 'gemini-3.5-flash']`
  - `audio`: `['gemini-2.5-flash-tts']`
  - `embedding`: `['gemini-embedding-1']`
- [x] O frontend não precisa implementar chamadas reais de backend agora para não quebrar fluxos em nuvem, mas o `AiRouterConfig` e o sistema de telemetria devem estar cientes desta lógica para o futuro. 

## 3. Qualidade & Finalização
- [x] Fazer commit após validar a UI.
- [x] Reportar ao usuário para dar `/vibe-apply` e continuarmos com a integração do backend (caso ele vá fazer nas Edge Functions).
