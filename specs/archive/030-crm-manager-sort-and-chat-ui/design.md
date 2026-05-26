# Design: UX do CRM, Ordenação e Status de Gerentes

## UI Components
- **KanbanCard (`src/components/Crm/KanbanCard.tsx`)**:
  - Exibir o tempo desde a última mensagem (ex: `5m`, `2h`, `3d`) ao lado do ícone do relógio, independentemente do status de SLA, focando puramente no `last_message_at`.
  - Fallback de Gerente: A lógica do componente `KanbanCard` tentará resgatar o gerente principal da unidade do Lead, caso o `lead.manager_id` seja nulo.
- **AuditPanel (`src/components/Crm/AuditPanel.tsx`)**:
  - O link será simplificado. Remover a badge azul escrito "CHATWOOT" e exibir apenas um ícone discreto `<ExternalLink className="w-4 h-4 text-muted-foreground hover:text-white" />` ao lado do nome do lead.
  - Para garantir a estabilidade do link, construiremos ele baseando-se no `integrationSettings` (se existir) ou apenas não o exibiremos, mas a condição deve funcionar garantindo apenas um ícone limpo.
- **ChatHistoryView (`src/components/Crm/ChatHistoryView.tsx`)**:
  - Trocar o label estático de "Online no Chatwoot" para "Canal Online".

## Logic Architecture
- **KanbanView (`src/components/Crm/KanbanView.tsx`)**:
  - Adicionar um bloco `.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())` no array `leads` antes ou durante o mapeamento nas colunas, garantindo a visualização dos mais recentes no topo.
