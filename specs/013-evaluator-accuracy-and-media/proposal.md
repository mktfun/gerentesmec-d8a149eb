# Proposal

## Requisitos
- **Correção Visual do Score:** O painel de auditoria não deve assumir 100% de preenchimento quando o checklist vier vazio ou faltante.
- **Acuidade da IA:** A IA (especialmente o Gemini CLI via Proxy) não deve pontuar itens no início do atendimento, e deve seguir rigorosamente as regras de avaliação.
- **Multimodalidade:** O sistema deve extrair e enviar corretamente mídias (áudio, imagens e vídeos curtos) para o Local AI Proxy, sem bloqueá-las no filtro de roteamento.

## User Stories
- **US1:** Como gerente, eu quero que o Kanban e o painel de auditoria mostrem exatamente a mesma nota (0% se nada foi validado), para que eu não ache que os parâmetros estão corrompidos.
- **US2:** Como gerente, eu quero que o áudio, fotos e vídeos trocados na negociação sejam repassados corretamente ao modelo rodando no meu proxy local, para que ele possa extrair informações visuais e auditivas antes de gerar a auditoria.

## BDD Scenarios
### Cenário: Sincronização em Atendimento Inicial
- **Given (Dado):** Uma conversa recém-criada (lead_new) onde o cliente diz "oi" e o gerente responde "bom dia".
- **When (Quando):** A IA avalia e determina que não há orçamento ainda. O score é calculado como 0 e o `audit_checklist` retorna vazio.
- **Then (Então):** Ao abrir o `AuditPanel`, todos os checkboxes devem estar desmarcados, exibindo 0 pts no anel de score.

### Cenário: Envio de Mídia via Proxy Local
- **Given (Dado):** O provedor está configurado como `Local AI Proxy (CLI Tunnel)`.
- **When (Quando):** O lead recebe um áudio `.oga` ou uma imagem `.jpg` pelo Chatwoot.
- **Then (Então):** A Edge Function converte isso para base64 com seu tipo MIME, o injeta no formato OpenAI via chave `image_url` data-URI e não descarta o conteúdo só porque não é "image". O LLM local recebe e analisa.
