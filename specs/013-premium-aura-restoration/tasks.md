# Tasks: Premium Aura Restoration (013)

## Fase 1: Dashboard Hero
- [ ] Editar `src/pages/Index.tsx` para recriar o card hero "Score Global da Rede" (78.5%) no topo, ocupando toda a largura, com 3 cards de unidade ao lado.
- [ ] Aplicar fundo `#0a0a0f` ou similar, bordas sutis e glow gradients para restaurar o aspecto premium do card.
- [ ] Mover/compactar as 4 métricas atuais para debaixo desse novo hero ou num layout horizontal harmonizado.

## Fase 2: TV Mode Dashboard
- [ ] Criar arquivo `src/components/Dashboard/TvDashboard.tsx`.
- [ ] Implementar 3 colunas gigantes (grid-cols-3) com os scores massivos de cada unidade.
- [ ] Atualizar `Index.tsx` para condicionalmente renderizar `TvDashboard` quando `isTvMode` for true.

## Fase 3: Edição Inline no Audit Panel (CRM)
- [ ] Atualizar `AuditPanel.tsx` e inserir um novo campo de input de "Valor Negociado/Orçamento" abaixo ou acima dos checklists.
- [ ] Ligar o `onBlur` do input para invocar o `updateLead` do `AppDataContext` para salvar sem modais extras.

## Fase 4: Relatórios (Health-First)
- [ ] Atualizar `src/pages/Relatorios.tsx`.
- [ ] Trocar os 3 cards principais para: "Score Geral", "Tempo Médio", "SLAs em Risco".
- [ ] Restaurar o visual dark Premium (Liquid Glass) com fundos pretos absolutos e bordas brancas a 6%, em vez do fundo cinza `bg-card`.

## Fase 5: Validação
- [ ] Compilar e validar design em ambos os temas.
