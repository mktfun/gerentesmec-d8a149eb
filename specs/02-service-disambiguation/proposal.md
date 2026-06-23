# Proposal: Desambiguação de Serviços no Worker Playwright

## 1. Visão Geral
Atualmente, o scraper do Tempario tenta buscar um serviço usando um termo específico (ex: "remoção de cambio"). Se o sistema retorna múltiplos serviços parecidos em um dropdown, o worker falha ou seleciona a primeira opção aleatoriamente. O objetivo é interceptar a lista de opções, classificar as opções com base em uma relevância semântica simples (para ser menos "burro" e evitar devolver opções completamente desconexas) e devolver um JSON no padrão `needs_service_selection` para que o n8n e o LLM solicitem a decisão do usuário via WhatsApp.

## 2. Casos de Uso
1. **Match Único/Forte**: Se a busca retornar apenas 1 resultado, ou se o primeiro do ranking tiver pontuação muito superior e "exata", seleciona automaticamente.
2. **Ambiguidade**: Retorna 2 ou mais opções pertinentes. Exemplo: usuário digitou "remoção de cambio" e a busca retornou "Remoção Cambio Automatico", "Remoção Cambio Automatizado", "Remoção Cambio PowerShift". O worker devolverá o array ordenado de opções, e o status `needs_service_selection`.
3. **Não Encontrado**: Se nenhuma opção visível do dropdown tiver qualquer correlação aceitável, retorna erro `not_found`.

## 3. Limites de API (Data Contract)
### Resposta de Ambiguidade de Serviço (HTTP 200 OK)
```json
{
  "request_id": "string",
  "status": "needs_service_selection",
  "service_query": "string (o que o usuário pediu)",
  "options": [ "string", "string" ],
  "message_for_user": "Encontrei estes serviços parecidos..."
}
```

## 4. Lógica de Relevância (Scoring Simples)
Um score básico será computado no Node.js para ordenar as opções do dropdown:
- **Termos exatos na query do usuário:** ganham +10 pontos.
- **Contexto do Veículo (Opcional):** Se o modelo capturado tiver "Aut." ou "Automatizado", e a opção tiver "Cambio Automatico", ganha +5.
- **Penalização:** Se o usuário pediu apenas "remoção de cambio" e a opção é "Remoção Cambio / Troca de Embreagem / Desmontagem de Motor", penaliza por complexidade não solicitada.
- As opções serão ordenadas (descendente) pelo score.
- As top N opções (ex: 5 a 8) serão retornadas no array `options`.
