# Funnel Sequence Refactor

## Contexto e Lacuna Identificada
O usuário pontuou que a sequência das colunas no Kanban e a lógica da Inteligência Artificial sobre a progressão das etapas está invertida e com um "vácuo". 
No estado atual, as colunas estão: `Novo Lead -> Em Orçamento -> Em Negociação`.
Isso quebra o raciocínio natural de vendas de oficina, onde primeiro o gerente *atende/negocia/diagnostica* o cliente, e só DEPOIS ele *envia o orçamento final* para aprovação.

## Requisitos
Ajustar a interface (KanbanView) e o prompt da IA (Edge Function) para refletirem o funil natural:
1. **Novo Lead (`lead_new`):** Caiu a mensagem do cliente. Gerente não respondeu.
2. **Em Atendimento (`negotiation`):** Gerente respondeu, está tirando dúvidas, avaliando o carro, negociando diagnóstico.
3. **Orçamento Enviado (`quote`):** Gerente cravou o valor ou enviou o link do checklist/orçamento. Aguardando o cliente dar o "sim".
4. **Ganho (`closed_won`):** Aprovado/Pago.
5. **Perdido (`closed_lost`):** Recusado.

## BDD Scenarios

### Cenário: Progressão Lógica de Atendimento
- **Given (Dado):** que o cliente chamou no WhatsApp e caiu em `Novo Lead`.
- **When (Quando):** o gerente responde: "Olá, pode trazer o carro para darmos uma olhada".
- **Then (Então):** a IA move o card para `Em Atendimento` (pois o atendimento começou, mas nenhum orçamento real foi enviado).
- **And When (E Quando):** o gerente envia depois: "Fica R$ 1.500 com as peças, segue o link".
- **Then (Então):** a IA move o card para `Orçamento Enviado`.
