# Proposal: Correção de Alinhamento e Avatares no Histórico de Chat

## Objetivos
Corrigir o banco de dados e a interface visual para refletir de maneira clara e adequada as mensagens dos contatos (clientes) e dos atendentes (gerentes), com os avatares adequados e na posição correta na tela, separando mensagens que no passado foram registradas de maneira equivocada como de um robô.

## User Stories
1. Como gerente, eu quero ver as mensagens enviadas por mim mesmo alinhadas à direita em balões coloridos, para distinguir claramente o que eu falei do que o cliente falou.
2. Como gerente, eu quero ver as mensagens enviadas pelo cliente alinhadas à esquerda em balões neutros, com a letra inicial do nome dele como avatar (ou sem foto robótica), para identificar facilmente quem me mandou mensagem.
3. Como gerente, se o sistema autônomo (ou a mecânica automatizada) interagir no chat com o cliente, eu quero ver a mensagem com o ícone de chave de boca (Wrench) para saber que foi uma automação.

## Critérios de Aceite
1. O banco de dados histórico da tabela `chat_messages` não deve conter `sender_type = 'bot'` para mensagens normais do gerente ou do cliente. As antigas devem ser corrigidas.
2. Mensagens com `sender_type = 'user'` (Gerente) devem estar à direita.
3. Mensagens com `sender_type = 'contact'` (Cliente) devem estar à esquerda e não exibir ícones robóticos ou chaves de boca, mas sim o avatar padrão de usuário com a primeira letra do seu nome.
4. Mensagens que de fato sejam `bot` permanecem à esquerda com o ícone de ferramenta.

## BDD Scenarios

### Cenário: Exibição de mensagem do cliente
- **Dado** uma mensagem registrada no banco com `sender_type: 'contact'` (cliente chamado "Mario")
- **Quando** o componente `ChatHistoryView` renderizar esta mensagem
- **Então** ela deve ser renderizada alinhada à esquerda
- **E** deve mostrar um avatar contendo a letra "M" na cor verde.

### Cenário: Exibição de mensagem do gerente
- **Dado** uma mensagem registrada no banco com `sender_type: 'user'`
- **Quando** o componente `ChatHistoryView` renderizar esta mensagem
- **Então** ela deve ser renderizada alinhada à direita
- **E** não deve mostrar um avatar na parte esquerda do balão.

### Cenário: Sincronização do legado
- **Dado** que há mensagens no banco de dados incorretamente salvas com `sender_type = 'bot'`
- **Quando** um script de migração/backfill consultar o Chatwoot
- **Então** as mensagens devem ter o seu `sender_type` atualizado no banco (para 'user' ou 'contact') correspondendo ao `message_type` original do Chatwoot (0 ou 1/2).
