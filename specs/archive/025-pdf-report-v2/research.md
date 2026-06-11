# Research: Melhorias no Relatório PDF (V2)

## Contexto Atual
O PDF está gerando uma lista sequencial de todos os leads aplicáveis (`closed_lost` ou ganhas com score < 60), mas eles não estão agrupados e faltam informações cruciais para a prestação de contas (Gerente e Unidade). Além disso, o layout tem problemas com quebra de página durante a impressão nativa.

## Pontos de Melhoria Identificados
1. **Falta de Agrupamento:** Atualmente, a lista é flat. O usuário solicitou "separar por unidade". Isso significa que o PDF deve renderizar um bloco para cada Unidade contendo seus leads problemáticos.
2. **Dados Ausentes:** Adicionar o nome da Unidade (como cabeçalho do agrupamento) e o nome do Gerente (no cabeçalho do Lead).
3. **Falhas de Paginação (CSS Print):** Mensagens longas estão sendo cortadas no meio. O CSS `@media print` suporta as propriedades `page-break-inside: avoid` (ou `break-inside-avoid` no Tailwind) que devem ser aplicadas nos contêineres de mensagens e blocos de leads.
4. **Visual/Fundos:** O contraste atual (fundo cinza nas mensagens do cliente e fundo índigo no gerente) precisa ser revisitado para tons mais brandos e profissionais, melhorando o "fundo" como o usuário pediu.

## Solução Técnica
No React, vamos processar `pdfData.leads` usando um `reduce` para agrupar por `unit_id`.
Durante a renderização (`pdfData.groupedLeads`), faremos um `.map()` pelas unidades, gerando um `h2` com o nome da unidade (podemos usar `page-break-before: always` se quisermos cada unidade em uma página nova, ou apenas separar visualmente).
Cada bolha de mensagem receberá a classe Tailwind `print:break-inside-avoid`.
