# Proposal: Feature 009 - Gemini Free Tier Smart Routing

## 1. Requisitos
1. **Roteamento Inteligente no Backend**: A aplicação agora deve suportar diferentes modelos dependendo do tipo da tarefa, em vez de um único `model` global em `ai_settings`.
2. **Fallbacks**: Se o modelo principal falhar (ex: Rate Limit 429), o sistema (Edge Function/Node) deve tentar automaticamente o próximo da lista antes de falhar a operação inteira.
3. **UI Simplificada**: Na tela "Acesso de Engenharia", teremos uma opção especial no select de modelo chamada `"Gemini Free-Tier Ensemble"`. Quando selecionada, o sistema aplica a tabela de roteamento no banco em vez de um modelo simples.
4. **Respeito aos limites**:
   - `scoring` usa contexto longo (Gemini Flash).
   - `pipeline` usa modelos rápidos de 15 RPM (Gemma 4).
   - `vision` usa Flash.
   - `audio` usa TTS.
   - `embedding` usa o modelo de embedding.

## 2. BDD Scenarios

### Cenário: Configurando o Ensemble Gratuito
- **Given (Dado):** O gerente abre o "Acesso de Engenharia" e a seção de seleção de provedor
- **When (Quando):** Ele seleciona "Google" como Provedor e, na lista de modelos, escolhe `"Gemini Free-Tier Ensemble (Auto-Routing)"`
- **Then (Então):** A interface indica que ativou o roteamento inteligente. No banco de dados, `ai_settings` salva `model = "gemini-free-ensemble"`, que é lido pelo backend para usar a tabela de roteamento.

### Cenário: Tolerância a Falhas por Rate Limit (Auto-Pipeline)
- **Given (Dado):** O modelo `gemma-4-31b` está com seu limite de 15 RPM esgotado
- **When (Quando):** O webhook do chatwoot pede para avaliar a intenção da mensagem (Auto-Pipeline)
- **Then (Então):** O backend tenta `gemma-4-31b`, toma 429 (Too Many Requests), e imeditamente cai pro fallback `gemma-4-26b`, que executa com sucesso, sem impactar o rate limit de 5 RPM do `gemini-3.5-flash` que está guardado para o scoring.

### Cenário: Economia na Avaliação Final
- **Given (Dado):** O sistema precisa dar nota numa conversa longa (Audit)
- **When (Quando):** A Edge Function de avaliação final é chamada
- **Then (Então):** O sistema usa `gemini-3.5-flash` (que possui limite apertado de 5 RPM mas janela de 250k). Se der erro, cai para `gemini-2.5-flash`.
