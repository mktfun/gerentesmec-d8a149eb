# Separação de Funil: Coluna "Perdidos" (Closed Lost)

## Requisitos
- Adicionar uma nova coluna na interface do CRM Kanban especificamente para Leads Perdidos (funnel_stage = 'closed_lost').
- A coluna "Encerrado" passará a exibir apenas os leads Ganho (funnel_stage = 'closed_won').
- Mudar visualmente os estilos e badges da coluna "Perdidos" para deixar claro que são leads negativados (cores avermelhadas/acinzentadas, dependendo do design system).
- A IA Autônoma já classifica os leads como `closed_lost` se o cliente rejeita o serviço ou para de responder, então a parte de backend da IA já está pronta. Apenas o Kanban precisa exibir de forma separada.

## User Stories
- **Como gerente**, eu quero ter uma visão clara de quantos e quais leads foram perdidos na oficina, para conseguir traçar novas estratégias de reengajamento (remarketing) futuramente.
- **Como sistema**, ao classificar uma conversa onde o cliente desiste (via webhook/IA), o card do lead deve mover-se automaticamente para a coluna de "Perdidos".

## BDD Scenarios

### Cenário: Agrupamento de Encerrados vs Perdidos
- **Given (Dado):** O sistema CRM está renderizando a tela de Kanban.
- **When (Quando):** O React puxa a lista de leads do banco de dados e os distribui nas colunas.
- **Then (Então):** Os leads com status `closed_won` devem renderizar exclusivamente na coluna "Ganho", e os leads `closed_lost` na recém-criada coluna "Perdidos".

### Cenário: A IA Autônoma perde o Lead
- **Given (Dado):** Um lead na coluna "Em Negociação".
- **When (Quando):** O cliente digita "Ficou muito caro, não vou fazer", a IA avalia e seta `closed_lost`.
- **Then (Então):** O sistema de Realtime do Supabase envia o evento de atualização, e o Card do lead salta visualmente (drag-and-drop auto) da coluna de Negociação para a nova coluna de "Perdidos".
