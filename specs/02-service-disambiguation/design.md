# Design & Architecture: Service Disambiguation

## 1. Mutações de Estado e Playwright
1. Em `tempario-scraper.mjs`, após a seleção do veículo, o bot digita o serviço na caixa de "Serviços" (`input[placeholder*="Pesquise o serviço"]`).
2. O bot aguarda o popover de opções Radix UI carregar (`[role="dialog"] [role="option"]`).
3. O bot coleta o texto de todos os `role="option"`.
4. É executada a função `rankServiceOptions(query, vehicleModel, options)`.

## 2. Lógica de `rankServiceOptions`
Assinatura: `(serviceQuery: string, vehicleModel: string, options: string[]) => Array<{text: string, score: number}>`
- Converte tudo para minúsculas e remove acentos para bater chaves (ex: "remocao" == "remoção").
- **Regra 1**: +10 se as palavras essenciais da query aparecerem na opção. (ex: query: "remoção de cambio". Palavras longas essenciais: "remocao", "cambio").
- **Regra 2 (Veículo Context)**: Se `vehicleModel` contiver "aut" ou "automatizado" ou "powershift", e a opção citar esse tipo de câmbio, +15.
- **Regra 3**: -5 se a opção for excessivamente longa (mais de 5 processos que não foram solicitados, como "/ repuxar / pintura").
- Ordenar os resultados. Retornar os que têm score > limite aceitável.

## 3. Lançamento da Exceção
Se `rankedOptions.length === 0`: Throw erro `SERVICE_NOT_FOUND`.
Se `rankedOptions.length === 1` OU a diferença de score do #1 para o #2 for gigante (> 20 pontos de gap): Clica no `rankedOptions[0]` automaticamente.
Se houver ambiguidade:
```javascript
throw new Error(JSON.stringify({
  type: "disambiguation",
  status: "needs_service_selection",
  selection_stage: "servico",
  service_query: queryParams.servico,
  message_for_user: `Encontrei mais de um serviço compatível para "${queryParams.servico}" nesse veículo. Qual deles você quer consultar?`,
  options: rankedOptions.map(o => o.text).slice(0, 7) // max 7 opções para n poluir o Zap
}));
```

## 4. Servidor `server.mjs`
O bloco de `catch` interceptará a string JSON do erro, converterá para objeto e responderá o cliente HTTP 200 OK, enviando o `options` e `message_for_user` sem corromper a string. (Já está preparado graças à refatoração anterior de desambiguação de veículos).
