# Rastreabilidade de Auditoria (Audit Traceability)

## Contexto
O usuário precisa entender o PORQUÊ de um item da auditoria ter sido marcado como "Concluído" pela Inteligência Artificial. Para garantir total transparência e confiabilidade, queremos "atrelar" cada check verde a uma mensagem específica no histórico da conversa que serviu como evidência.

## Requisitos
1. Toda vez que a IA marcar um item do checklist de `false` para `true`, o sistema deve registrar o ID da mensagem que provocou essa mudança.
2. Na interface (`AuditPanel`), ao lado de um item marcado como concluído, deve aparecer um ícone/botão (ex: olho ou lupa).
3. Ao clicar nesse botão, a tela de histórico do chat (`ChatHistoryView`) deve rolar automaticamente até a exata mensagem que provou aquele checklist e destacá-la visualmente (com um pulsar, borda diferente ou mudança de opacidade).

## BDD Scenarios

### Cenário: Validando evidência de checklist
- **Given (Dado):** O lead enviou a mensagem "Pode fazer o conserto" e o gerente respondeu com um vídeo (mensagem M1).
- **When (Quando):** A IA avalia a mensagem M1 e marca o item "2b: Enviou vídeo mostrando o defeito" como TRUE.
- **Then (Então):** O sistema salva no banco de dados que a evidência para "2b" é a mensagem M1.
- **And (E):** Na interface de auditoria, ao clicar na lupa ao lado de "2b", o chat rola automaticamente até a mensagem M1 e a faz brilhar em verde por 2 segundos.
