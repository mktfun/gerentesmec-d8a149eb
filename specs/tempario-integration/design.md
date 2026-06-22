# Design Document: Integração Tempario

## 1. Arquitetura do Microserviço Playwright (Worker)
Será um microserviço puramente focado em navegação e extração de dados (Node.js + Express/Fastify + Playwright).

### 1.1 Componentes Internos
1. **api-server**: Roteador HTTP recebendo `POST /api/query`. Retorna as respostas JSON com base nos resultados do `query-runner`. Valida schema de entrada.
2. **session-manager**: Cuida de ler o `storageState.json` do disco antes de instanciar o context do Playwright. Identifica se a sessão está expirada.
3. **navigator / query-runner**: Executa as etapas do Tempario:
   - Acessar URL base.
   - Selecionar Placa ou Veículo de forma estruturada.
   - Buscar serviço.
   - Extrair Tabela (Tempo Padrão / Moeda / Homem Hora).
4. **extractor**: Processa o DOM e normaliza os números e strings.
5. **error-handler**: Captura screenshots, HTML dump (se configurado) em pasta dedicada `data/errors/`.

### 1.2 Estratégia de Navegação na UI
- Preferir `getByTestId` ou `getByRole` com nome acessível.
- Esperar por renderização do elemento alvo e não usar sleep explícito (`page.waitForSelector`, `page.waitForLoadState('networkidle')`).
- Timeout global por etapa.

## 2. Orquestração e Fila (n8n)
O projeto n8n externo vai ser responsável por:
1. Receber Webhooks do provedor WhatsApp.
2. Trigger node: Message In.
3. AI Agent Node:
   - Coletar/confirmar as propriedades do veículo (placa, marca, modelo, etc).
   - Quando tiver as infos mínimas: emitir "pronto_para_pesquisar" com as props em JSON.
4. Normalizador de Payload: Trata as chaves e envia via HTTP Request pro Worker.
5. HTTP Request: POST ao IP/Porta onde roda o Worker Node.js.
6. Switch/Router final com base no status do payload JSON do worker (Trata Erro vs Trata Sucesso).

## 3. Gestão de Estado
- Não há banco de dados novo no Worker, é totalmente Stateless exceto pelo arquivo `storageState.json` mantido num volume persistente (`/data`).
- Estado da conversa é gerido pelo N8N Memory / Langchain.

## 4. Verificação Direcionada a Cenários (Phase 4 SDD)
Cenários para teste durante o Verify:
- **Cenário A: Sucesso com Placa**. Placa existe, carro preenchido automaticamente, lista de serviço retorna o tempo correto. Resposta = `ok`.
- **Cenário B: Placa não encontrada**. Veículo não encontrado pelo Tempario. Resposta = `not_found`.
- **Cenário C: Veículo Ambíguo**. Motor/Ano múltiplos disponíveis. Resposta = `ambiguous`.
- **Cenário D: Sessão Expirada**. Cookie inválido redireciona para login. Resposta = `session_expired` + screenshot do erro para o bot notificar o admin que a sessão precisa ser renovada.
