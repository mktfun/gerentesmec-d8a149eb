# Design: 002-ai-autonomy

## 1. Modelagem de Dados (Supabase Backend)

A arquitetura utilizará o PostgreSQL com a extensão `pgvector` para possibilitar o Cache Semântico e a compressão do histórico.

### Novas Tabelas e Extensões
1. **Extensão**: Ativar `CREATE EXTENSION IF NOT EXISTS vector;`.
2. **Tabela `semantic_cache`**:
   - `id` (uuid)
   - `input_hash` (text) - Hash rápido (SHA-256) para match exato.
   - `embedding` (vector(768)) - Vetor para similaridade semântica.
   - `output_json` (jsonb) - O resultado cacheado.
   - `created_at` (timestamptz)
   - `ttl_expires_at` (timestamptz) - Para expiração de cache.

3. **Tabela `lead_memories` (Memoization)**:
   - `lead_id` (uuid)
   - `compressed_history` (text) - O resumo atual das negociações até o momento.
   - `last_processed_message_id` (uuid) - Marcador de onde a IA parou.

### Alterações em `ai_settings`
Adicionar as seguintes colunas (jsonb ou tipos nativos):
- `system_prompt` (text)
- `evaluation_criteria` (jsonb) - Os pesos e perguntas do checklist de forma dinâmica.
- `features` (jsonb) - `{ auto_scoring: true, auto_pipeline: true, vision: true, audio: false }`
- `embedding_provider` (text) - Ex: `gemini-text-embedding-004`.

## 2. Arquitetura "Cost-Efficient" (Edge Functions)

A análise da IA não rodará a cada mínima mensagem (anti-padrão de "token waste"). A arquitetura seguirá este fluxo no `chatwoot-webhook`:

1. **Gatekeeper Determinístico**:
   - A mensagem entra. Se for menor que 15 caracteres e não possuir anexo, ou se for uma "mensagem automática de ausência", o sistema registra no BD e encerra a execução.
2. **Batching / Delay**:
   - Ao invés de analisar instantaneamente, o sistema pode acionar uma fila ou verificar se faz mais de X minutos desde a última mensagem (fim de uma "sessão" de conversa).
3. **Semantic Caching**:
   - O input comprimido gera um embedding. Faz-se uma busca por `cosine_distance` no `semantic_cache`. Se `similarity > 0.95`, reaproveitamos a estrutura de pontuação.
4. **Prompt Compression**:
   - O prompt enviado ao Gemini (ou OpenAI) incluirá apenas: `lead_memories.compressed_history` + `Novas mensagens não lidas`. O LLM devolverá o novo Score e o novo `compressed_history`, que substituirá o antigo.

## 3. Design de Interface (UI/UX 2026)

### Tela de Configuração (Advanced AI Panel)
- Seguindo o *Maximalismo Tátil* e *Apple Liquid Glass*:
- **Gatilho**: No final da tela `Config.tsx`, um botão fantasma extremamente sutil com um ícone de `Cpu` ou `Sparkles`. Ex: "Acesso de Engenharia" (Opacidade baixa, revela no hover).
- **Modal/Slide-over**: Um painel que entra deslizando de baixo ou do lado direito. Fundo de vidro esfumaçado escuro (`backdrop-blur-3xl bg-black/60`).
- **Conteúdo**:
  - **Prompt Master**: Textarea com tipografia monoespaçada fina (foco em código/prompt).
  - **Critérios (JSON/Visual)**: Inputs para as perguntas de cordialidade, com sliders para o peso de cada etapa.
  - **Toggles "Dopamínicos"**: Switches robustos, com feedback háptico (animações framer-motion) para ligar/desligar "Análise de Visão/Mídia", "Automação de Funil", "Auto-Scoring".
  - **Estatísticas de Custo (Observabilidade)**: Mini-dash integrado mostrando "Tokens Economizados via Cache" e "Custo Estimado por Lead".
