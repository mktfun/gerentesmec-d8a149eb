# Design: Chat Timeline Events & Real History (022)

## UI (ChatHistoryView.tsx)
- **Remoção de Mock:** O array de fallback fixo com IDs falsos será deletado. Exibiremos um *empty state* elegante se a lista estiver vazia.
- **Pills de Sistema (Timeline Events):**
  Se a mensagem tem `sender_type === 'system'`, o componente renderiza uma estrutura flexível e minimalista no centro.
  - O estilo será baseado na estética Revolut (Maximalismo Tátil misturado com minimalismo de interface).
  - Background `bg-white/[0.04]` com borda ultrafina `border border-white/[0.08]`.
  - Padding minúsculo: `px-3 py-1`.
  - Tipografia: Fonte 10px, Medium ou SemiBold, cor `text-muted-foreground/80`.
  - Radius total: `rounded-full`.
  - Nenhuma identificação de remetente ou balão. Apenas a frase (Ex: "Etapa alterada para Em Negociação").

## Banco de Dados
A tabela `chat_messages` já suporta o texto livre (`content`) e o campo `sender_type`. 
Se a constraint/checagem do banco permite o valor `'system'` em `sender_type`, não precisaremos rodar nenhuma migration. Apenas salvar a string literal da ação como `content`.
*(Opcionalmente, as funções que alteram score ou Kanban irão injetar essas linhas como "logs" no histórico de chat do lead)*.
