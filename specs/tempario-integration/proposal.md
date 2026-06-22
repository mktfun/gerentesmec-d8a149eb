# Proposal: Integração Tempario (Playwright + n8n)

## 1. Visão Geral
Construir uma automação operacional para oficinas em que o atendente ou mecânico envie uma solicitação por WhatsApp, o fluxo no n8n colete e normalize os dados do veículo/serviço, um worker Playwright autenticado consulte o Tempario usando sessão reaproveitada e a resposta volte formatada ao usuário via chatbot.

## 2. Limites da API e Contratos de Dados

### 2.1 Endpoint do Worker (Entrada)
O worker Playwright expõe um endpoint HTTP (ex: `POST /api/query`) que recebe as requisições do n8n.
```json
{
  "request_id": "uuid",
  "unit_id": "loja-centro",
  "user_id": "mecanico-123",
  "query": {
    "placa": "ABC1D23",
    "marca": "Volkswagen",
    "modelo": "Gol",
    "ano": 2022,
    "motor": "1.6",
    "servico": "troca de embreagem"
  },
  "options": {
    "headless": true,
    "capture_screenshot_on_error": true,
    "timeout_ms": 90000
  }
}
```

### 2.2 Resposta do Worker (Saída)
Sucesso:
```json
{
  "request_id": "uuid",
  "status": "ok",
  "vehicle": {
    "placa": "ABC1D23",
    "descricao": "Volkswagen Gol 1.6 2022"
  },
  "service": {
    "descricao": "Troca de embreagem",
    "tempo_padrao_horas": 4.5,
    "valor_hora": 180,
    "valor_servico": 810,
    "moeda": "BRL"
  },
  "raw": {
    "source": "tempario_ui"
  },
  "meta": {
    "duration_ms": 18342,
    "screenshot_path": null
  }
}
```

Erros Padronizados (`status` possíveis: `not_found`, `ambiguous`, `session_expired`, `ui_error`, `validation_error`):
```json
{
  "request_id": "uuid",
  "status": "session_expired",
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "Sessão autenticada inválida ou expirada",
    "retryable": false
  },
  "meta": {
    "duration_ms": 9200,
    "screenshot_path": "/data/errors/uuid.png"
  }
}
```

## 3. Limites de Responsabilidade
- **n8n**: Orquestração do bot de WhatsApp, controle de fila e timeout, retries de infraestrutura, roteamento por unidade, invocação do Playwright.
- **Microserviço Playwright**: Interagir diretamente com a interface web do Tempario de forma determinística, extrair dados em JSON, reaproveitar state `storageState.json`.
- **IA (dentro do n8n)**: Interpretar a intenção do mecânico, extrair os dados e conversar, preenchendo as lacunas e gerando um JSON legível para o orquestrador, bem como transformando a saída em texto agradável.

## 4. Requisitos Funcionais
1. **Consulta por placa** (prioritária).
2. **Fallback para marca/modelo** se placa não resolver.
3. Extração de descrição do serviço, tempo padrão e valor homem-hora (quando presente).
4. Suporte a múltiplas lojas com roteamento lógico.
5. Emissão de status canônicos: `ok`, `not_found`, `ambiguous`, `session_expired`, `ui_error`, `validation_error`.

## 5. Requisitos Não Funcionais
1. Uso de `storageState.json` para manter sessão ativa.
2. Worker opera com baixa concorrência por conta/sessão.
3. Observabilidade via logs de erro e salvamento de screenshot em caso de falha.
4. Segredos e cookies protegidos e isolados.
