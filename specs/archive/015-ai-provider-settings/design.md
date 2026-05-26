# Design Document: Dynamic AI Provider Settings (015)

## 1. UI / UX Updates (2026 Guidelines)

### 1.1 Tela de Configurações (`/config`)
- A tela deixará de ser um esqueleto e ganhará uma arquitetura de duas colunas ou container centrado premium (Maximalismo Tátil).
- Fundo escuro com gradientes localizados nos cards.

### 1.2 Card de Provedor IA
- Dropdown personalizado ou chips estilizáveis para selecionar a rede neural (OpenAI, Anthropic, Google, OpenRouter).
- Campos de texto com background `bg-white/[0.03]` e bordas luminosas `focus:border-primary` ao focar.
- Campo de API Key com botão de "👁️ Mostrar/Esconder".
- Botão primário "Salvar & Conectar" com feedback em tempo real (spinner em SVG, ícone de check mark de sucesso).

### 1.3 Card Multimodal
- Sessão "Sensores de Qualidade" focada em Multimodal.
- Cada opção (Visão, Vídeo, Áudio) será um cartãozinho clicável (Switch Card) elegante, mudando de cor quando ativado (ex: borda esmeralda ou indigo e um glow leve interno).
- Dica de texto sutil (Tooltip ou texto de apoio cinza) avisando que áudio/vídeo aumentam o consumo de tokens.

### 1.4 Estado da Aplicação
- Vamos criar no `AppDataContext` ou um contexto separado `SettingsContext` os campos:
  - `aiProvider: string`
  - `aiModel: string`
  - `aiApiKey: string`
  - `features: { vision: boolean, audio: boolean, video: boolean }`
