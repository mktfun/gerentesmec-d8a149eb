# TV Dashboards & Relatórios Read-Only

## 1. Ajuste em TV Executivo
Removeremos o indicador de "Ticket Financeiro na Mesa" do painel do CEO, uma vez que nem toda negociação possui um valor definido com clareza, evitando exibir dados irreais. O foco será apenas no **Score Global da Rede**, **Ranking de Gerentes** e **Volumetria (Atendimentos)**.

## 2. Ajuste em Relatórios (Read-Only)
A inserção do `AuditPanel` completo na tela de Relatórios gerou uma visualização muito "operacional" (com checkboxes, botões de salvar, inputs de edição). Como a tela de Relatórios é para o Daniel (CEO) auditar e validar o que a IA fez, a visão precisa ser limpa e de **Leitura (Read-Only)**.
- O painel voltará a ser focado no `ChatHistoryView`.
- Criaremos um painel lateral enxuto (Read-Only) apenas mostrando:
  - **Nota Final (Score)**
  - **Checklist (O que pontuou e o que zerou)**
  - **Acesso rápido (Ícone de alvo) para rolar até a mensagem do chat.**
- Sem botões de "Salvar Auditoria", sem campos para digitar placa de veículo ou dossiê editável. Apenas consumo de dados.

## Requisitos
- Atualizar a Master Spec da TV para remover o Financeiro.
- Criar um componente `ReadOnlyAuditSummary` para a tela de Relatórios.
- Reverter o modal do `Relatorios.tsx` para usar a combinação `ChatHistoryView` + `ReadOnlyAuditSummary`.
