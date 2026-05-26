# Design & Rules

## Mapeamento Lógico (Supabase AI)
- `lead_new`: Novo Lead.
- `negotiation`: Em Atendimento (O gerente começou a falar, mas ainda não cravou valores).
- `quote`: Orçamento Enviado (O gerente passou os valores ou link).
- `closed_won`: Aprovou.
- `closed_lost`: Rejeitou.

*A palavra-chave do banco de dados será mantida (`negotiation` e `quote`) para evitar migrações complexas que quebrem dados antigos, apenas mudaremos a ordem de exibição na UI e a descrição.*

## Stitch MCP (Frontend UI)
A ordem de colunas no `KanbanView.tsx` será ajustada para refletir a nova sequência:
1. `lead_new` (Novo Lead)
2. `negotiation` (Em Atendimento) - *Renomeado de "Em Negociação" para fazer mais sentido*
3. `quote` (Orçamento Enviado) - *Renomeado de "Em Orçamento"*
4. `closed_won` (Ganho)
5. `closed_lost` (Perdido)
