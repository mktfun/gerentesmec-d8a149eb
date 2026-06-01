# Research: Local AI Proxy Provider

## Contexto
O usuário deseja utilizar o `gemini-cli` ou um servidor local em seu próprio computador (exposto via Cloudflare Tunnel) como o provedor de Inteligência Artificial para a plataforma. O objetivo primário é utilizar essa estrutura para fazer as avaliações e scores automáticos (Auditoria) de cada conversa gerada na oficina.

## Arquitetura Atual
- A avaliação das conversas ocorre de forma assíncrona/autônoma através da Edge Function `ai-autonomous-evaluator`.
- Atualmente, a Edge Function suporta os provedores: `Google Vertex AI`, `Google` (Gemini API Direta via AI Studio), `NVIDIA NIM`, `OpenRouter` e `OpenAI` nativo.
- As configurações do provedor são armazenadas na tabela `ai_settings` do banco de dados Supabase e são configuráveis no Frontend, possivelmente na tela de "Configurações" ou "Acesso de Engenharia".

## Desafio
1. **Nova Edge Function de Proxy ou Chamada Direta?**
   O usuário propôs a criação de uma Edge Function intermediária `ai-proxy` (Supabase). No entanto, como a função `ai-autonomous-evaluator` já processa o contexto (prompts pesados, RAG e JSON format output), a abordagem ideal arquiteturalmente é **adicionar um novo Provider nativo dentro do roteador do `ai-autonomous-evaluator`**, que irá redirecionar as requisições de chat (POST) direto para a URL do túnel do Cloudflare usando o Bearer Token fornecido (CLIPROXY_KEY).
   
2. **Atualização da Interface de Configurações (Frontend)**
   O painel de controle do AI precisará de uma nova opção de Provedor chamada `Local AI Proxy (CLI Tunnel)`.
   Quando selecionado, o usuário deverá inserir:
   - API URL: ex `https://training-additionally-academy-adipex.trycloudflare.com`
   - API Key: ex `key-8bb35a9f6a724543a5e788ee55b1c880`

## Concorrentes e Referências
O uso de túneis locais (ngrok/Cloudflare) para rotear LLMs é comum em setups de desenvolvimento e orquestração Open Source como LM Studio ou Ollama. A implementação será baseada num wrapper compatível com o padrão OpenAI Chat Completions `v1/chat/completions`, que é o formato exportado pelo proxy providenciado pelo usuário.
