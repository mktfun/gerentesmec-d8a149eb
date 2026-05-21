# Design: UI de Configuração Chatwoot & Analytics

## Supabase Database Modificações
Para salvar as configurações da API do Chatwoot no sistema, criaremos uma tabela `system_configs`:
- `id` (PK)
- `chatwoot_url` (text)
- `chatwoot_api_token` (text, opcional/criptografado no futuro, texto por hora para fins de POC).

## UX/UI Design - Aba Chatwoot (Config.tsx)
- Faremos o design Liquid Glass da Revolut Bank.
- Painel "Step-by-Step" com 3 passos visuais:
  1. Configurar Conexão de Saída (Pegar a URL do Webhook).
  2. Inserir Token de Acesso do Chatwoot.
  3. Sincronizar Conversas Antigas.
- Um botão gigantesco e copioso "Copiar URL Webhook" que usa a Clipboard API e anima (`Copied!`).

## Analytics e Dashboard (Relatorios.tsx e Index.tsx)
- `Relatorios.tsx`: Hoje, a tabela inferior está vazia (`Nenhuma auditoria registrada neste periodo.`). Vou conectar ao array genérico de `leads` e renderizar as últimas 10 auditorias ordenadas pela data. O "Tempo Médio de Resposta" será calculado usando a soma dos `wait_time_minutes`.
- `Index.tsx`: Substituirei o overflow-x-auto com cards em flex, que pode estar apertando o layout, por um layout de **Grid Auto-Fit** ou manter os cards horizontais mas fixando larguras ou usando Carrossel vertical se não couber. O usuário mandou um print e os cards estavam sendo "cortados". Retornaremos ao grid elegante.
