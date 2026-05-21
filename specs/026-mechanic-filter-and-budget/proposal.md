# Proposal: Filtro de Mecânicas e Correção do Orçamento

## Objetivos
1. Evitar que conversas entre mecânicas (ou testes internos usando os números das próprias mecânicas) gerem leads/cards no Kanban.
2. Garantir que a edição do Orçamento Estimado (`ticket_value`) seja persistida no banco e atualizada imediatamente na interface, corrigindo a falha visual.

## User Stories
1. Como gerente de rede, eu quero cadastrar o número de telefone de cada mecânica, para que o sistema ignore conversas originadas por esses números e não suje meu funil.
2. Como gerente, eu quero digitar um valor no campo "Orçamento Estimado" do dossiê, e quero que esse valor seja salvo imediatamente e permaneça na tela após clicar fora, para que eu tenha certeza que foi salvo.

## Critérios de Aceite
1. O banco de dados deve permitir salvar o `phone` na tabela de Unidades (`units`).
2. A tela de "Nova Unidade" (ou a edição via Supabase inicialmente) deve permitir informar esse telefone.
3. O Webhook do Chatwoot deve varrer as unidades cadastradas. Se o `sender.phone_number` bater com algum telefone de unidade, o processamento deve ser abortado com `200 OK` (Ignorado).
4. Ao alterar o `ticket_value` e desfocar o input (onBlur), a UI deve invocar `updateLead` atualizando o estado do React instantaneamente (Optimistic Update).
5. O valor digitado no orçamento não deve sumir.

## BDD Scenarios

### Cenário: Cliente comum manda mensagem
- **Dado** que um cliente com telefone '+5511999999999' envia mensagem no Chatwoot
- **E** este telefone não pertence a nenhuma Unidade
- **Quando** o webhook interceptar a conversa
- **Então** um novo Lead deve ser criado na esteira Kanban.

### Cenário: Mecânica manda mensagem para testar
- **Dado** que a unidade "Tork SBC" tem o telefone '+5511888888888' cadastrado no banco
- **Quando** o webhook interceptar uma conversa cujo contato seja este número
- **Então** o sistema deve retornar sucesso mas **NÃO** inserir um lead na esteira.

### Cenário: Inserindo Orçamento Estimado
- **Dado** que o lead "Mario" está aberto no painel lateral
- **Quando** o gerente digitar "1500" no Orçamento Estimado e clicar fora
- **Então** o valor 1500.00 deve ser visível na UI imediatamente
- **E** uma requisição silenciosa deve salvar o valor 1500 no Supabase de forma confiável.
