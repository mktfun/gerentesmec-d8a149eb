# Proposal: Manager View Redesign & Audit Inspector Enhancements

## Requisitos de Negócio
1. **ManagerDashboard:** Deve suportar uma visualização separada entre "Dashboard" (Métricas) e "Lista de Conversas".
2. **Caixa de Entrada (Inbox):** A lista de conversas deve imitar o estilo do WhatsApp (lista linear, com preview da última mensagem e avatar), eliminando o layout de "Kanban cards".
3. **Inspector de Conversa:** O painel de auditoria deve mostrar claramente o que o vendedor "Errou" e "Acertou" no topo.
4. **Notas In-Line (Chat Timeline):** As avaliações de qualidade da IA (ex: "Faltou vídeo" ou "Enviou orçamento") devem ser injetadas visualmente no fluxo da conversa, logo abaixo da mensagem correspondente ou agrupadas em momentos chave.
5. **Midia Player Melhorado:** O player de áudios, vídeos e imagens do chat precisa ser repaginado para um visual luxuoso, sem estourar o layout do container.

## BDD Scenarios

### Cenário: Navegação entre Dashboard e Conversas
- **Given (Dado):** que o usuário (Gerente) está na página inicial de sua oficina
- **When (Quando):** ele visualiza a tela principal
- **Then (Então):** ele verá duas abas ou filtros superiores (ex: "Visão Geral" e "Conversas") permitindo alternar entre o gráfico de performance e a lista de inbox.

### Cenário: Visualização de Notinhas da IA na Timeline
- **Given (Dado):** que um Mecânico ou Gerente abre uma auditoria no `ManagerAuditInspector`
- **When (Quando):** ele faz o scroll pela timeline do WhatsApp
- **Then (Então):** abaixo de mensagens estratégicas (ex: mensagem contendo vídeo ou orçamento), deve haver um "Badge" ou "Balão da IA" indicando se aquele comportamento pontuou positivamente no checklist ou se faltou algo.

### Cenário: Reprodução de Áudio na Timeline
- **Given (Dado):** que existe uma mensagem de voz (`audio/ogg`) na timeline
- **When (Quando):** o usuário clica em reproduzir
- **Then (Então):** o player não deve usar os controles feios padrão do HTML, mas um componente minimalista estilizado no padrão de UI (botão circular de play, linha do tempo arredondada).
