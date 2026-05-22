# Design: Ajuste de Métricas, Realtime e Visualizador de Histórico

## Frontend (React + Shadcn UI + Framer Motion)

### 1. Atualização do Cálculo de Relatórios
- **Arquivo**: `src/pages/Relatorios.tsx`
- **Ação**: O cálculo das notas E1, E2, E3, E4 e Score Geral para a tabela *Performance por Etapa* será modificado. Em vez de calcular a média (`avg()`) apenas dos itens presentes nas arrays (`mp.e1`, `mp.scores`), o total somado será dividido pelo **número total de leads (`totalLeadsForManager`)** daquele gerente durante o período selecionado.
- Isso unifica a lógica com a alteração feita anteriormente no `Index.tsx`.

### 2. Componente de Histórico de Conversa (MessageViewer)
- Criar um novo componente modal `LeadHistoryModal.tsx` ou implementar dentro de `Crm.tsx`.
- **UI 2026**:
  - Estilo Sheet deslizando da direita (Liquid Glass), com blur acentuado no background (`backdrop-blur-3xl`).
  - Lista cronológica de mensagens com balões de chat.
  - Mensagens do cliente (esquerda, fundo `muted/50`), mensagens do gerente (direita, fundo `indigo-500/20`), mensagens da IA (centralizadas ou marcadas com ícone de robô).
  - Um botão no `LeadCard` ou comportamento de click no próprio card que abre este modal.

### 3. Melhorias no Realtime
- **Arquivo**: `src/context/AppDataContext.tsx`
- **Ação**: O contexto já escuta eventos de Realtime. O problema geralmente reside na UI que não engatilha uma reordenação quando o estado muda localmente. Validar se a dependência do Kanban está usando as referências de estado mais atualizadas e orientar o usuário a ativar o Realtime na interface do Supabase para as tabelas essenciais (`chat_messages`, `leads`). Se não houver listener para `chat_messages`, nós criaremos um no AppDataContext para alimentar a UI do Histórico em tempo real.

## Backend (Supabase)
- Nenhuma modificação no schema do banco de dados será necessária, apenas orientações de configuração de replicação Realtime.
