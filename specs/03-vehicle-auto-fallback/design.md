# Design & Architecture: Auto-Fallback para Desambiguação de Veículos

## 1. Mutações de Estado e Playwright
1. Em `tempario-scraper.mjs`, no Passo 3 (Busca de Veículo), interceptamos o Modal de "Atualizar o Modelo".
2. Atualmente o código faz:
```javascript
if (optionCount === 1) {
  // seleciona e segue
} else {
  // extrai opções, fecha modal e joga erro needs_vehicle_selection
}
```
3. O novo design fará:
```javascript
const maxOptionsToPrompt = 8; // Se passar disso, talvez melhor perguntar ou assumir.
let vehicleAssumed = false;
let vehicleCandidatesCount = optionCount;
let vehicleAssumedName = "";

if (optionCount === 1) {
  // Seleciona a única opção
} else {
  // Auto-fallback: seleciona a primeira da lista!
  vehicleAssumed = true;
  vehicleAssumedName = await modalOptions.nth(0).textContent();
  await modalOptions.nth(0).click();
  await btnAtualizar.click();
}
```

## 2. Compatibilidade com API do n8n
O contrato do JSON de sucesso passará de:
```json
{
  "request_id": "...",
  "status": "ok",
  ...
}
```
Para:
```json
{
  "request_id": "...",
  "status": "ok",
  "vehicle": {
     "placa": "...",
     "descricao": "Fiesta 1.6 Aut.",
     "assumed": true,
     "candidates_count": 4
  },
  "message_for_user": "Assumi o modelo Fiesta 1.6 Aut. encontrado pela placa. Se não for esse, me avise que eu refaço o orçamento.",
  ...
}
```

## 3. Gestão de Risco
- **Risco**: Assumir um modelo 1.0 quando o carro na verdade era 2.0, gerando um orçamento de correia dentada sub-faturado.
- **Mitigação**: O `message_for_user` é obrigatório para que a LLM passe ao cliente o "disclaimer" da suposição.
- **Edge-Case**: Se a busca de Serviços não encontrar nada para aquele carro assumido, o erro do serviço estourará normalmente.
