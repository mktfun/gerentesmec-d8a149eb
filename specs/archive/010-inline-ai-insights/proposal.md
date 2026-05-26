# Inline AI Insights (Raciocínio Contextual no Chat)

## Contexto e Lacuna Identificada
O usuário deseja que as justificativas da Inteligência Artificial sobre a movimentação de etapa do funil e sobre a pontuação do checklist sejam exibidas de forma clara, contextualizada e não-intrusiva **diretamente no histórico de mensagens (ChatHistoryView)**, logo abaixo da mensagem que causou a ação. 

Atualmente, o raciocínio fica agrupado apenas no Dossiê final (`closing_summary`), perdendo o contexto exato de *qual* fala do gerente gerou *qual* interpretação da IA.

## Requisitos
1. A IA deve gerar um `ai_insight` específico para a mensagem avaliada contendo seu raciocínio ("Por que mudei de etapa?" ou "Por que dei essa pontuação agora?").
2. Este `ai_insight` precisa ser salvo no banco de dados, atrelado diretamente à linha daquela mensagem específica.
3. A interface do histórico (ChatHistoryView) deve renderizar essa nota de forma elegante (ex: um balãozinho brilhante com o logo da IA), imediatamente após a mensagem do gerente.
4. A exibição não pode "sujar" ou poluir a visualização natural da conversa pelo operador.

## BDD Scenarios

### Cenário: Exibição Contextual de Raciocínio
- **Given (Dado):** que o gerente enviou sua primeira mensagem ao cliente com um vídeo.
- **When (Quando):** a IA avalia essa mensagem e altera o status do lead para `Em Negociação`.
- **Then (Então):** um insight (balão roxo brilhante com ícone de ✨) aparecerá logo abaixo desta mensagem exata no histórico do CRM, com a justificativa: "IA: Movi o lead para Em Negociação pois o gerente realizou o primeiro contato e enviou vídeo."
