# Proposal: Correção da Identificação de Origem do Chat

## Requisitos
1. O sistema deve distinguir com precisão milimétrica quem enviou a mensagem (Cliente, Gerente, Bot/Sistema).
2. A UI deve refletir instantaneamente a correção sem precisar alterar o frontend, pois o problema é nos dados gerados pelo Webhook.
3. O histórico antigo de mensagens marcadas como "robô" de forma errônea deve ser higienizado (migração/script de dados).

## User Stories
1. Como Diretor, quero que as mensagens que meus gerentes enviam apareçam do lado direito (User) e as dos clientes do lado esquerdo (Contact), para que eu não perca tempo tentando adivinhar quem falou o quê.
2. Como Gerente da oficina, não quero ver minhas próprias mensagens marcadas com um ícone azul de robô, me causando confusão.

## BDD Scenarios

### Cenário: Mensagem enviada pelo WhatsApp via WappConnect
- **Dado** que o Chatwoot recebe uma mensagem de um cliente (WhatsApp) e dispara o webhook com `message_type: "incoming"`.
- **Quando** a Edge Function processar esse payload.
- **Então** ela deve classificar `sender_type` como `contact`, ignorando o fato de que "incoming" não é um número.

### Cenário: Ação do Gerente no Painel
- **Dado** que o Gerente respondeu ao cliente e o payload contém `sender: { type: "user" }` e `message_type: "outgoing"`.
- **Quando** o Webhook gravar a mensagem.
- **Então** o registro no banco deve conter `sender_type = 'user'` e aparecer corretamente no Histórico.
