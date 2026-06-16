# Proposal: Correção Avançada dos Filtros de Relatório em Lote

## 1. O Problema
O usuário relatou que a exportação de relatórios em lote não funciona ao aplicar filtros de "Checks não marcados". A tela sempre diz "Nenhum lead elegível", mesmo quando há leads que se encaixam nos critérios.

**Causas raiz identificadas:**
1. **O Bug dos 7 dias (Date Range Ignorado):** A função `handleExportPDF` estava ignorando completamente o calendário de datas selecionado na tela de relatórios e forçando um hardcode de "apenas leads dos últimos 7 dias" (`Date.now() - 7 * 86400000`). Se os leads de teste forem mais antigos que 7 dias, eles nunca aparecerão.
2. **O Bug do Booleano (String "false"):** Ao verificar se um check falhou, o código fazia `!checklist[id]`. Se o banco retornasse o valor como string `"false"`, o JavaScript avaliava `!("false")` como `false`, ignorando a falha.
3. **Falta de Lógica AND/OR:** Quando o usuário marcava 3 opções, o sistema usava nativamente a lógica "OR" (qualquer falha). O usuário deseja poder escolher entre buscar leads que falharam em "TODAS as selecionadas (AND)" ou "PELO MENOS UMA das selecionadas (OR)".

## 2. A Solução
Para corrigir isso de forma robusta e atender ao pedido do usuário:
- **Respeitar o Calendário:** Atualizaremos o `handleExportPDF` para usar exatamente a data `dateRange.from` e `dateRange.to` do calendário na tela principal.
- **Tratamento de Booleano:** Criaremos uma função segura `isFailed(val)` que considera tanto `false` nativo quanto a string `"false"`, além de `null`/`undefined`.
- **Toggle AND/OR Modal:** No `ExportOptionsModal.tsx`, vamos adicionar um Toggle de modo de filtro: "Qualquer falha selecionada (OR)" vs "Todas as falhas selecionadas (AND)", passando essa preferência para a função de exportação.

## 3. Benefícios
- O relatório finalmente exportará dados corretos.
- O gerente terá flexibilidade total para cruzar métricas (ex: buscar leads que especificamente falharam no orçamento E no fechamento, ou leads que falharam em um OU outro).
- Fim das mensagens falsas de "Nenhum lead elegível".

## 4. Aprovação Necessária
> [!IMPORTANT]
> Aprova essas correções profundas no mecanismo de filtros e exportação do relatório?
