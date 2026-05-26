# Proposal: Botão de Gatilho Manual da Avaliação (IA)

## Requisitos
- **Botão Sutil na UI:** Um botão localizado em `AuditPanel.tsx`, ao lado de "Ir para o Chatwoot", com ícone minimalista (ex: Sparkles ou Refresh) indicando "Reavaliar Conversa", sem estética espalhafatosa de IA.
- **Acionamento Manual Completo:** O clique neste botão deve forçar a IA a analisar o chat inteiro, passar a etapa do funil (se ativado), marcar o checklist e gerar o dossiê.
- **Uso do Contexto/Memória:** A IA deve utilizar o sistema já existente de resumos acumulativos (Memoization na tabela `lead_memories`) para economizar tokens. O histórico consolidado deve ser passado.
- **Integração com Webhook:** A existência do botão NÃO descarta nem desliga a avaliação automática via Webhook, agindo puramente como redundância ou operação forçada em massa ("fallback").

## BDD Scenarios

### Cenário: Acionamento Manual com Sucesso
- **Given (Dado):** O usuário está visualizando um card no CRM cujas mensagens recentes não foram devidamente capturadas pela IA automática (ex: webhook falhou).
- **When (Quando):** O usuário clica no botão "Sincronizar Avaliação".
- **Then (Então):** O sistema coleta as mensagens recentes da interface, as formata e envia uma requisição manual para a Edge Function `ai-autonomous-evaluator`. O card é atualizado na tela instantaneamente com o novo Score, Etapa e Dossiê, e a IA compacta a nova memória para poupar tokens futuros.

### Cenário: Exibição Sutil na Interface
- **Given (Dado):** O usuário abre a visualização lateral do card (AuditPanel).
- **When (Quando):** O usuário olha a barra superior de ações onde está o botão "Ir para o Chatwoot".
- **Then (Então):** O botão de "Sincronizar" é renderizado utilizando estilos consistentes, como bordas sutis e um hover elegante (Liquid Glass/Minimalista), alinhado perfeitamente sem roubar o protagonismo visual.
