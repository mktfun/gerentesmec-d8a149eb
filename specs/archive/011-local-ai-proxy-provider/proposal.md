# Proposal: Local AI Proxy Provider

## Objetivo
Adicionar suporte nativo à plataforma para executar o "Local AI Proxy (CLI Tunnel)". Isso permitirá contornar provedores nativos hospedados e direcionar as cargas de trabalho pesadas (Auditoria de Conversas e Score de Leads) diretamente para o computador local do usuário via um túnel do Cloudflare, com um bypass autônomo compatível com a API padrão do OpenAI (`v1/chat/completions`).

## Requisitos
- **Backend (Edge Function):** A função `ai-autonomous-evaluator` deve interceptar o provider "Local AI Proxy", estruturar o payload no formato OpenAI e enviar um POST para `[API_URL]/v1/chat/completions` passando o Bearer Token.
- **Frontend (UI Settings):** O painel de Configurações de IA precisa expor o Provider "Local AI Proxy (CLI Tunnel)" na dropdown de opções.
- **Armazenamento:** A tabela `ai_settings` já suporta os campos `api_url` e `api_key`. Apenas gravaremos os valores neles quando o usuário salvar a configuração.
- **Resiliência:** Tratamento de timeout nativo caso o túnel Cloudflare caia ou fique offline, para o score da IA não crachar silenciosamente, mas registrando no `llm_usage_logs` que o túnel não respondeu.

## User Stories
- **Como Administrador (Engenharia):** Eu quero selecionar "Local AI Proxy (CLI Tunnel)" na configuração da IA para não gastar limites de API de provedores corporativos, e direcionar o trabalho pesado pro meu próprio processamento e ferramentas.
- **Como Agente do Sistema (Evaluator):** Eu quero que o endpoint Local processe a requisição exatamente igual à do OpenAI, e me retorne JSON estruturado, para que a pontuação do lead (audit) aconteça sem quebrar a lógica RAG atual.

## BDD Scenarios

### Cenário: Avaliação enviada via túnel Cloudflare local
- **Given (Dado):** O sistema está configurado com Provider "Local AI Proxy (CLI Tunnel)", `API_URL` apontando pro túnel, e `API_KEY` preenchida com a chave do proxy. O túnel está online.
- **When (Quando):** A Edge Function `ai-autonomous-evaluator` é disparada por uma nova mensagem do WhatsApp no Lead.
- **Then (Então):** A função constrói o prompt, envia o POST com Bearer Token pro túnel, recebe o texto JSON retornado pelo PC do usuário, calcula o Score final, salva no Supabase (leads) e insere um log bem sucedido no `llm_usage_logs`.

### Cenário: Túnel Cloudflare local está offline (Desconectado)
- **Given (Dado):** O Provider está setado como "Local AI Proxy", mas o terminal no PC do usuário foi fechado (O processo `cloudflared` parou).
- **When (Quando):** A Edge Function tenta contatar a URL para classificar a conversa.
- **Then (Então):** A conexão falha (timeout ou 502/530 do Cloudflare). O sistema lança uma Exception tratada, registra na tabela `llm_usage_logs` o status de erro ("Túnel Offline ou Inalcançável"), e não altera o Score do lead, esperando uma futura re-tentativa quando o túnel subir.
