# Plano de Implementação: Filtro de Estudo de Caso (Pontos Críticos)

## Visão Geral
Em vez de rodar uma nova Edge Function/Cronjob aleatória para achar erros, vamos **reutilizar a Inteligência Artificial que já audita as conversas diariamente**. O sistema buscará automaticamente a **Pior Auditoria da Semana** (o Lead com o menor `score` gerado pela IA e que tenha motivos de falha críticos registrados) e o transformará no "Weekly Roast" (Estudo de Caso).

## Vantagens
1. **Nenhuma tabela extra necessária:** Já temos o `score`, `audit_reasons` (que contém o `evidence` / citação exata) e o `closing_summary` das auditorias reais na base de dados.
2. **Mais Certeiro:** Foca no que a IA já considerou o pior atendimento da semana.
3. **Dinâmico:** O Diretor pode mudar o filtro de data (ex: últimos 15 dias) e o Estudo de Caso se adapta imediatamente na tela, puxando o pior caso daquele período filtrado.

## User Review Required
> [!IMPORTANT]
> Aprova essa abordagem? Em vez de um cronjob na sexta-feira, o próprio sistema de Relatórios vai varrer as auditorias que você selecionou e pinçar o pior Score (ex: Score 30) para colocar no telão vermelho como o "Foco da Reunião", exibindo as provas (evidências) exatas que a IA já havia coletado!

## Proposed Changes

### 1. `Relatorios.tsx` (Frontend)
- Remover o "Mock" que injetamos temporariamente.
- Na hora de montar o `pdfData` (botão Exportar), o código fará:
  - Ordenar os leads daquela loja pelo `score` (do menor para o maior).
  - Pegar o Lead 0 (O pior atendimento).
  - Extrair de dentro do `audit_checklist.audit_reasons` a prova exata (`evidence`) e a regra quebrada (`title`).
  - Preencher o Bloco Vermelho com esses dados.
  - Se o pior score da semana for excelente (ex: acima de 85 ou 90) ou não houver falhas, renderizar o 🏆 Padrão Ouro.

### 2. Remoção do Código Obsoleto
- Excluir o script `test_roast.mjs`.
- (Opcional) Podemos deletar a edge function `ai-weekly-inquisitor` recém-criada, pois a função será gerida nativamente pelo React no Frontend baseado na IA que já atua sobre os leads.

## Verification Plan
1. Rodarei o Build do Vite.
2. Pedirei para você testar clicando novamente no PDF. O PDF abrirá trazendo como Estudo de Caso *exatamente* o lead com pior nota que a sua IA já avaliou no passado, mostrando a transcrição original e a justificativa sem alucinar.
