# Research: Dynamic AI Provider Settings & Multimodal (015)

## 1. Contexto do Pedido
O usuário rejeitou a ideia de ter os prompts e provedores "hardcoded" (fixos no backend). Ele deseja uma arquitetura onde ele, como leigo, possa entrar no sistema (ex: aba de Configurações) e alterar:
1. **O Provedor de IA** (ex: OpenAI, Anthropic, OpenRouter).
2. **O Modelo Específico** (ex: `gpt-4o`, `claude-3-5-sonnet`, `gemini-1.5-pro`).
3. **A API Key** utilizada.
4. **Capacidades Multimodais:** Habilitar suporte à leitura de imagens, vídeos e áudios que são enviados no Chatwoot (para verificar se o mecânico realmente enviou vídeo do defeito, como exigido no SLA).

## 2. Análise Técnica e Arquitetura

### 2.1 Interface de Configuração (UI)
Atualmente a rota `/config` existe na Sidebar mas não tem conteúdo. Precisamos construir uma UI premium onde o usuário pode cadastrar essas credenciais de forma segura. O modelo de UI deve se assemelhar a painéis de agentes autônomos (como o Hermes), permitindo selecionar provedores via Dropdown e testar a conexão.

### 2.2 Armazenamento Seguro (Supabase)
As API Keys não podem ficar soltas.
- Solução: Criar uma tabela `ai_settings` no Supabase com uma única linha (Single Row).
- Como as chaves são sensíveis, a Edge Function que escuta o webhook do Chatwoot precisará buscar essas chaves do banco de dados no momento em que roda, invés de usar variáveis de ambiente estáticas do projeto.

### 2.3 Multimodal (Áudio e Vídeo)
O Chatwoot envia arquivos anexados nas mensagens via URL no JSON do Webhook.
- A Edge Function precisará extrair o `attachments[].data_url` do payload do webhook.
- Áudio: Modelos nativos suportam áudio ou podemos precisar transcrever via Whisper-1 antes.
- Vídeo: A API da OpenAI / Gemini suporta frames de vídeo, ou teremos que processar frames. Como a prioridade agora é o *design e preparação da estrutura front-end* dessa configuração, focaremos na UI de ligar/desligar esses recursos multimídia e testar o provedor.

## 3. Direção do Plano (RPI-R)
Vamos desenhar a interface `/config` para abstrair toda essa complexidade tecnológica do usuário final. O front-end não salvará ainda no banco (fase de mock), mas criará o Contexto de configuração, deixando tudo 100% pronto para o Edge Function consumir.
