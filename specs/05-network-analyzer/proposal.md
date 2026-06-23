# Proposal: Analisador de Tráfego de Rede (API Discovery)

## 1. Visão Geral
Atualmente, o robô do Tempario opera 100% via UI Automation (Playwright guiando o DOM). Embora seja seguro, é mais lento e consome mais recursos do servidor. O objetivo é criar um framework de testes (Network Analyzer) que instrumente o Chromium para escutar, gravar e classificar as requisições internas (XHR/Fetch/GraphQL) que a UI faz pro backend do Tempario.

A meta final é identificar se conseguimos ignorar a UI e fazer as buscas de veículos e serviços diretamente consumindo os endpoints internos (reaproveitando os cookies da sessão válida).

## 2. A Arquitetura Proposta

Vamos dividir a implementação do Analisador em 3 componentes principais, exatamente como você desenhou:

### Fase 1: Network Recorder (`network-recorder.mjs`)
- **Como funciona:** Um script de Playwright modificado que abre o Tempario e assina os eventos `page.on('request')` e `page.on('response')`.
- **O que ele faz:** Ao fazer um fluxo completo (Busca de Placa -> Modal -> Busca de Serviço -> Cálculo), ele grava **todas** as requisições num arquivo `.har` e também num JSON limpo (`traffic_dump.json`) contendo headers, payload e URLs.

### Fase 2: Endpoint Classifier (`endpoint-classifier.mjs`)
- **Como funciona:** Um script Node.js puro que lê o `traffic_dump.json`.
- **O que ele faz:**
  - Remove ruídos (Google Analytics, imagens, CSS, Sentry).
  - Filtra apenas requisições `POST` e `GET` que retornem `application/json`.
  - Procura por padrões na URL (ex: `/api/v1/vehicles`, `/graphql`, `/api/services`).
  - Ranqueia os "Melhores Candidatos" (endpoints que contêm a Placa ou o Nome do Serviço no Payload).

### Fase 3: Replay Tester (`replay-tester.mjs`)
- **Como funciona:** Pega a lista de "Melhores Candidatos" e tenta refazer a chamada HTTP usando `node-fetch` ou Axios, ignorando o Playwright, mas injetando os Cookies exportados pelo perfil persistente.
- **O que ele testa:**
  1. Sucesso da chamada direta (Bateu 200 OK?).
  2. Validação CSRF (Exigiu um Header secreto gerado pelo frontend?).
  3. Estabilidade (Funciona para placas diferentes mudando apenas o JSON?).

## 3. O Resultado (Entregável)
No final do teste, geraremos um relatório `api_discovery_report.md` com a matriz final:
- Quais rotas são `UI-only` (exigem o robô clicando).
- Quais rotas são `Request-Direct` (podem ser migradas para Fetch rápido).
- Uma **PoC (Proof of Concept)** funcional fazendo a busca usando apenas Fetch + Cookies.

## Open Questions
> [!IMPORTANT]
> 1. Para eu gerar o tráfego rico, precisarei simular fluxos reais no `network-recorder.mjs`. Você quer que eu simule o fluxo de "Carga de Bateria do Fiesta" como fluxo padrão do teste?
> 2. Posso começar a implementação do `network-recorder.mjs` imediatamente na pasta atual do `tempario-worker` (e rodar os testes localmente sem atrapalhar a fila em produção)?
