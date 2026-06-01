# Design: Local AI Proxy Provider

## Frontend UI (Stitch MCP)
### Modal de Configurações de IA (`Acesso de Engenharia` > `Configurações de Rota`)
O design continuará utilizando o padrão `Liquid Glass` (TailwindCSS Backdrop-Blur + Sombras suaves).

**Mudanças:**
- **Dropdown "Provider AI":** Adicionar uma nova `<option>` de valor `Local AI Proxy (CLI Tunnel)`.
- Quando este provider estiver selecionado, a UI se adaptará da seguinte forma:
  - **Campo de Modelo:** Aparecerá preenchido (ou editável) para definir qual nome de modelo o proxy local do usuário espera (ex: `gemini-3.5-flash` ou `llama3`).
  - **Campo de API Key:** O placeholder se tornará `"Token de Acesso do Proxy (ex: key-...)"`.
  - **Campo Extra (API URL):** Como a tabela `ai_settings` possui o campo `api_url`, vamos exibir um `Input` específico para este Provider onde o usuário cola a URL do Cloudflare Tunnel. (ex: `https://...trycloudflare.com`).

**Estética e Feedback Visual:**
Exibir um card ou Alert em estilo Neon/Glass alertando: "Atenção: Você precisa garantir que o comando `cloudflared tunnel` esteja em execução no seu computador para que a plataforma se conecte."

## Modelagem de Banco de Dados (Supabase MCP)
A tabela `ai_settings` **não** requer migrações novas, pois já possui colunas para `api_url` e `api_key`. Apenas o Frontend e a Edge Function precisarão ser alterados para interagir corretamente.

**Tabela `ai_settings` existente:**
- `provider` (text): Armazenará o valor `'Local AI Proxy (CLI Tunnel)'`
- `model` (text): Armazenará a identificação do modelo a repassar
- `api_key` (text): Bearer token esperado pelo túnel local
- `api_url` (text): O endpoint base do túnel. Na Edge function, será concatenado com `/v1/chat/completions`.
