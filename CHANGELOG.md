# Changelog

All notable changes to this project will be documented in this file.

## [2026-05-28]
### Added
- **010-ai-ensemble-telemetry**: Implementação do loop real de Fallbacks (bypass de Rate Limits) no backend via Supabase Edge Functions para a arquitetura "Gemini Free-Tier Ensemble". Integração da inserção de "Inputs (Prompts)" e "Outputs" completos na Telemetria, visíveis em logs bem-sucedidos.
- **009-gemini-free-smart-routing**: Implementação de arquitetura de roteamento inteligente (Smart Routing/Auto-Ensemble) no cliente e backend, dividindo tarefas por demanda em múltiplos modelos (Gemma, Flash, TTS, Embeddings) para respeito estrito às cotas gratuitas do Google AI Studio (Free Tier).
- **008-ai-settings-logs**: Ocultamento de todo o painel de Inteligência Artificial para uma zona de risco "Acesso de Engenharia". Atualização dos modelos base gratuitos na lista de seleção. Adição de modal aprofundado de telemetria ("Ver Detalhes") permitindo ler input real enviado pro LLM e sua saída crua.
- **007-rich-media-players**: Substituição de tags de mídia HTML5 nativas por componentes ricos e imersivos. Adição do `CustomAudioPlayer` com controles fluidos e do `ExpandableMedia` que possui Lightbox/Cinema Mode com animações Framer Motion, usados no dashboard de vistoria do Gerente e na visualização do Mecânico.
- **006-audit-inspector-precision**: Implementação da ancoragem de comentários da IA estritamente baseada no Message ID exato, removendo distribuição aleatória (`STEP_WINDOWS`). Atualização do visual com framer-motion layout.
- **005-audit-inspector-redesign**: Atualização visual e terminológica do histórico de vistoria dos mecânicos. O componente de auditoria passou a suportar Theming Dinâmico e foi completamente limpo da estética cyberpunk, adotando o design claro "Anti-burro" e alterando a CTA de 'Avaliar Atendimento' para 'Vistoriar Atendimento'.
- **004-manager-dashboard-redesign**: Concluída a implementação do Redesign da UX dos Mecânicos. Nova barra de navegação "Pílula", sistema anti-erros com botões enlargados e suporte real-time para Modo Claro/Escuro (Theme Toggle) baseados na spec TripGlide.

## [2026-05-26]
### Added
- **001-multi-llm-providers**: Implementado o suporte a múltiplos provedores LLM na plataforma. Adicionado integração transparente com os endpoints gratuitos da NVIDIA NIM e autenticação baseada em JWT Service Accounts para uso da camada Enterprise/gratuita do Google Vertex AI.
