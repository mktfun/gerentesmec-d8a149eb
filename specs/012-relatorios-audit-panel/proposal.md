# Relatórios - Detalhamento de Auditoria

## Contexto e Lacuna Identificada
O usuário pontuou que, na tela de Relatórios, ao abrir o histórico de uma conversa muito extensa, fica difícil entender a pontuação. Ele deseja ver a quebra de pontos do checklist e ter a facilidade de **clicar no ponto e navegar rapidamente para a mensagem** onde a pontuação foi dada.
Atualmente, a tela de Relatórios exibe apenas o componente `ChatHistoryView`, que mostra os balões e os gatilhos embaixo, mas não exibe o painel lateral com o score detalhado (checklist completo), que já existe nativamente na tela do CRM (`AuditPanel`).

## Requisitos
- Substituir o modal de histórico simples da tela de Relatórios pelo componente `AuditPanel` completo.
- Manter o modal em tela cheia/wide para abrigar tanto o chat quanto a barra lateral de pontuação.
- Reutilizar a mecânica existente do `AuditPanel` de clicar no item do checklist para iluminar e rolar (scroll) a mensagem correspondente no chat.

## BDD Scenarios

### Cenário: Visualizando histórico detalhado em Relatórios
- **Given (Dado):** que o usuário (gestor) está na tela de Relatórios.
- **When (Quando):** o usuário clica na linha/card de um atendimento na tabela de Auditorias (Recentemente Avaliados).
- **Then (Então):** o sistema abre um modal largo exibindo o `AuditPanel`.
- **And When (E Quando):** o usuário clica no item "2c - Explicou consequências" no painel direito.
- **Then (Então):** a lista de mensagens à esquerda rola automaticamente para a mensagem do gerente que justificou esse item, e a mensagem pisca destacada.
