# Proposal: Auto-Fallback para Desambiguação de Veículos

## 1. Visão Geral
Atualmente, se a busca por placa no Tempario exigir "Atualizar o Modelo" e retornar múltiplas opções, o worker Playwright devolve o status `needs_vehicle_selection` e interrompe a busca. Isso gera atrito, pois os usuários finais frequentemente desconhecem a motorização exata. 

A nova abordagem introduz o `auto_first_with_notice`. Se houver ambiguidade veicular, o sistema assumirá o modelo mais provável (o primeiro da lista ou o mais aderente à query), continuará o fluxo até extrair o orçamento do serviço, e avisará o usuário sobre a suposição.

## 2. Casos de Uso
1. **Match Único**: 1 opção de modelo = Seleciona silenciosamente. (Sem mudanças).
2. **Ambiguidade Controlada (Auto-Fallback)**: Retorna a lista do modal, mas o worker seleciona o primeiro item automaticamente e **continua** até buscar o serviço. No JSON final (status `ok`), injeta um aviso de que o veículo foi assumido.
3. **Ambiguidade Crítica (Opcional Futuro)**: Se a lista for gigantesca e a variância de tempo de serviço for sabidamente alta, trava e pergunta (por hora, o default será auto-fallback sempre que possível).

## 3. Limites de API (Data Contract)
Adição de um nó `notice` ou modificação do `status` para `ok_assumed_vehicle` no payload de sucesso:

```json
{
  "request_id": "string",
  "status": "ok",
  "vehicle": {
    "placa": "string",
    "descricao": "string (Modelo assumido)",
    "assumed": true,
    "candidates_count": 4
  },
  "service": { ... },
  "message_for_user": "Assumi o modelo Fiesta 1.6 16v Flex Aut. 5p encontrado pela placa. Se não for esse, me avise que eu refaço o orçamento."
}
```

## 4. Lógica de Execução no Playwright
- No passo de "Atualizar o Modelo", capturamos os `optionCount`.
- Em vez de fechar o modal e lançar erro de `needs_disambiguation`, clicamos na opção `0` (primeira da lista filtrada pela placa).
- Marcamos uma flag `vehicleAssumed = true`.
- O código flui normalmente para a etapa de Serviços.
- No momento do `return result`, verificamos a flag `vehicleAssumed` para anexar o `message_for_user`.
