# Proposal: Vertex AI Config Streamlining (012-vertex-ai)

## 1. O Problema
Atualmente, para configurar o Vertex AI, o usuário precisa buscar seu `Project ID` no painel do Google Cloud e digitar a região, o que é um processo técnico, sujeito a erros de digitação e pouco amigável. Além disso, a lista de modelos suportados estava defasada em relação aos modelos de fronteira mais recentes.

## 2. A Solução Proposta
Apenas "jogar o JSON lá e deixar a mágica acontecer". O aplicativo irá:
- Analisar silenciosamente o JSON assim que for colado.
- Extrair o `project_id` e o `client_email` automaticamente.
- Usar a região padrão `us-central1` por baixo dos panos.
- Exibir uma interface de confirmação elegante (Liquid Glass / Maximalismo) confirmando que o sistema entendeu as credenciais.
- Atualizar a lista de modelos com as versões de última geração (ex: `gemini-1.5-pro-002`, `gemini-3.5-flash`).

## 3. Requisitos de Negócios e Técnicos
- O sistema não deve exigir o preenchimento manual do Project ID.
- O Edge Function e a camada de Frontend devem utilizar o `project_id` extraído do próprio JSON.
- A telemetria deve continuar funcionando normalmente.

## BDD Scenarios

### Cenário: Configuração "Zero-Click" do Vertex AI
- **Dado** que o usuário está na aba de "Configurações de Rota" e seleciona "Google Vertex AI".
- **Quando** o usuário cola o conteúdo válido de um arquivo `credentials.json` (Service Account) na área de texto.
- **Então** o sistema deve ocultar as áreas de texto, exibir um *card* bonito dizendo "Conta de Serviço Conectada", exibir o Nome do Projeto (`project_id`) automaticamente, salvar no banco e habilitar os modelos mais recentes como `gemini-3.5-flash`.

### Cenário: Compatibilidade de Modelos mais Recentes
- **Dado** que o usuário está escolhendo um modelo do provedor Vertex AI.
- **Quando** ele abre o menu *dropdown*.
- **Então** ele verá opções robustas e modernas, incluindo as versões Enterprise (ex: `gemini-3.5-flash`, `gemini-1.5-pro-002`), sendo faturadas diretamente na conta GCP de forma otimizada.
