# RPI-R: Pesquisa e Contexto (Feature 009 - Gemini Free Tier Smart Routing)

## 1. Mapeamento do Desafio
O Google AI Studio oferece cotas generosas, mas altamente fragmentadas em diferentes modelos (Flash, Flash Lite, Gemma, Embeddings, TTS). Atualmente, a aplicação tenta rodar tudo no mesmo modelo selecionado pelo usuário no `AiRouterConfig`.
Se o usuário usa o modelo `gemini-2.5-flash` gratuito, o Rate Limit de 5 RPM (Requests Per Minute) será esgotado rapidamente se o sistema usar esse modelo para classificar mensagens curtas, avaliar a conversa inteira, e transcrever áudio tudo ao mesmo tempo.

## 2. Inventário de Limites Gratuitos (AI Studio)
Temos as seguintes opções ativas no Free Tier:
- **Modelos Leves / Alta Frequência (Text-only)**:
  - `gemma-4-31b` e `gemma-4-26b`: **15 RPM**, TPM ilimitado, 1.5K RPD. Excelente para tarefas de auto-pipeline e classificação rápida de intenção por mensagem.
  - `gemini-3.1-flash-lite`: **15 RPM**, 250K TPM, 500 RPD. Excelente fallback.
  - `gemini-2.5-flash-lite`: **10 RPM**, 250K TPM, 20 RPD. 
- **Modelos Densos / Multimodais (Contexto Longo & Visão)**:
  - `gemini-2.5-flash`, `gemini-3.5-flash`, `gemini-3-flash`: **5 RPM**, 250K TPM. Excelentes para Auditoria da conversa inteira (scoring), pois exigem janela de contexto imensa e suportam imagens de orçamentos/carros.
- **Modelos Especializados**:
  - `gemini-2.5-flash-tts`: **3 RPM** para transcrição de áudio nativa.
  - `gemini-embedding-1`: **100 RPM** para gerar embeddings e salvar no pgvector (Semantic Caching).
  - `imagen-4-fast-generate`: 25 RPD para geração (provavelmente não usaremos agora, mas útil saber).

## 3. O Que Precisa Ser Feito
Para tornar o sistema "Free-Tier Resilient", precisamos transformar a seleção de "Modelo" da UI. Em vez de o usuário escolher 1 modelo que fará tudo, ele escolherá um "Preset de Roteamento".

Quando ele selecionar "Gemini (Gratuito Otimizado)" na UI (Painel de Engenharia), o sistema configurará automaticamente no Supabase um JSON de roteamento (Routing Table) que dividirá as funções:
- `task_scoring` -> Primary: `gemini-3.5-flash`, Fallbacks: `[gemini-2.5-flash, gemini-3-flash]`
- `task_pipeline` -> Primary: `gemma-4-31b`, Fallbacks: `[gemma-4-26b, gemini-3.1-flash-lite]`
- `task_vision` -> Primary: `gemini-2.5-flash`, Fallback: `gemini-3.5-flash`
- `task_audio` -> Primary: `gemini-2.5-flash-tts`
- `task_embedding` -> Primary: `gemini-embedding-1`

Dessa forma, as 5 RPMs do Flash não serão gastas para mover card no pipeline, garantindo uso quase ilimitado sem pagar $1.
