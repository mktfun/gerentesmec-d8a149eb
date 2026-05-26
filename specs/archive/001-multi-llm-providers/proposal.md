# Proposal: 001 - Suporte Multi-LLM Providers (NVIDIA NIM e Vertex AI)

## Goal
Implementar suporte nativo a provedores de LLM gratuitos e enterprise (NVIDIA NIM e Google Vertex AI) para permitir que a IA Autônoma (AI Evaluator) e as demais features continuem operando em alta performance sem custos adicionais com chaves limitadas da OpenAI ou do Gemini Studio. Tudo isso mantendo a estrutura base (Stitch MCP + Supabase MCP) inalterada e garantindo máxima integridade do banco e das edge functions.

## Requisitos de Negócio
- A UI de Configuração deve permitir a seleção fluida entre os provedores de LLM disponíveis: `OpenAI`, `Gemini Studio`, `NVIDIA NIM`, `Google Vertex AI`.
- A integração com `NVIDIA NIM` deve apenas adaptar a `api_url` e o cabeçalho, sendo totalmente transparente para os endpoints baseados na estrutura OpenAI-compatible.
- A integração com `Google Vertex AI` deve permitir o uso de **GCP Service Accounts (JSON)** para autenticação, em vez de depender de uma API Key simples.
- A Edge Function `ai-autonomous-evaluator` deve ser capaz de criar tokens Bearer JWT via RS256 dinamicamente a partir das credenciais da Service Account.
- A experiência de usuário não deve ser prejudicada; mensagens de erro sobre falha de autenticação devem ser exibidas claramente se o JSON da GCP for inválido.

## User Stories
1. **Como Gerente do Sistema**, eu quero poder entrar nas Configurações de IA, escolher "NVIDIA NIM", colar minha `nvapi-XXX` e salvar, para começar a utilizar modelos gratuitos da Nvidia.
2. **Como Administrador**, eu quero poder entrar nas Configurações, selecionar "Vertex AI", fazer o upload (ou colar) o JSON da minha conta de serviço GCP e definir minha região/projeto, para rotear todas as requisições de análise de conversas por dentro do meu projeto enterprise do Google.
3. **Como IA Autônoma (Edge Function)**, eu preciso receber corretamente os dados de provider no banco, e se o provider for `vertex_ai`, eu devo assinar o token JWT usando as credenciais do banco e fazer a chamada para a URL do Vertex `publishers/google/models/${model}:generateContent` garantindo a persistência do atendimento.

## Critérios de Aceite
- [ ] A tabela `ai_settings` foi alterada via Supabase Migration para adicionar os campos `gcp_credentials` (jsonb), `gcp_project_id` (text), e `gcp_region` (text).
- [ ] A tela de configuração possui um toggle ou select refinado para Provider.
- [ ] Os campos de credenciais na UI alternam de acordo com o Provider selecionado.
- [ ] O script da Edge Function `ai-autonomous-evaluator` suporta a geração de token OAuth Bearer para Vertex AI.
- [ ] A Edge Function roda local e remotamente sem falhas de pacote npm/esm (usar importMaps se necessário ou cdn confiável).

## BDD Scenarios

### Cenário: Configuração de NVIDIA NIM
- **Dado** que o usuário está na tela de Configurações e o provedor atual é OpenAI
- **Quando** ele seleciona o provider "NVIDIA NIM" e insere a chave `nvapi-1234`
- **Então** o sistema deve atualizar o banco (`ai_settings.provider = 'nvidia_nim'`, `ai_settings.api_key = 'nvapi-1234'`) e a Edge Function passará a rotear chamadas para `https://integrate.api.nvidia.com/v1/chat/completions`.

### Cenário: Configuração de Google Vertex AI
- **Dado** que o usuário deseja usar a cota gratuita do GCP
- **Quando** ele seleciona "Google Vertex AI", insere o JSON da Service Account, o Project ID `meu-projeto-123` e Região `us-central1`
- **Então** a UI deve salvar o JSON completo no banco (campo `gcp_credentials`)
- **E** a Edge Function, ao ser trigada, deve criar um Bearer JWT usando as credenciais antes de invocar o LLM.
