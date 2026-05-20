# Tasks: Dynamic AI Provider Settings (015)

## Fase 1: Estado Global (Contexto)
- [ ] Atualizar `src/context/AppDataContext.tsx` (ou criar `SettingsContext`) para suportar: `aiProvider`, `aiModel`, `aiApiKey`, e flags `multimodal` (vision, video, audio).
- [ ] Garantir que o estado persista ou esteja mockado para inicializar corretamente.

## Fase 2: UI Configurações Iniciais
- [ ] Criar a página de configurações em `src/pages/Config.tsx` (substituir o placeholder).
- [ ] Dividir a página em seções elegantes: "Motor de IA (LLM)" e "Capacidades (Multimodal)".

## Fase 3: Inputs de Provedor
- [ ] Implementar Dropdown para Provider (OpenAI, Anthropic, OpenRouter).
- [ ] Implementar Input para Model Name.
- [ ] Implementar Password Input para API Key (com botão de ver/esconder).
- [ ] Criar o botão "Salvar & Testar Conexão" que simula o teste e exibe um status visual de sucesso.

## Fase 4: Switches Multimodal
- [ ] Desenhar Cards de toggle (Switch) para "Leitura de Orçamentos (Visão)", "Análise de Vídeo" e "Transcrição de Voz".
- [ ] Conectar os toggles ao estado global.
