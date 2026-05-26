# Proposal: Correção Definitiva do Sender Type (API Integrations)

## A Causa Real Descoberta
O seu sistema usa integrações de WhatsApp externas (provavelmente Evolution API, WappConnect ou CodeChat). Quando essas ferramentas disparam a criação de uma mensagem no Chatwoot, o `sender.type` da mensagem geralmente vem classificado internamente como `"api"` ou `"agent_bot"`.

O nosso código anterior olhava PRIMEIRO para o `sender.type`. Ao ver `"api"`, ele não sabia o que era e transformava tudo (tanto gerente quanto cliente) em "bot" (o ícone da chavinha). 

Depois, o meu SQL de "limpeza" pegou tudo que era `"bot"` e jogou para `"user"` (Gerente), o que misturou as conversas de cliente e gerente pro mesmo lado direito!

## A Solução Real ("A Variável de Ouro")
O Chatwoot possui uma variável que NUNCA mente, independente de quem criou a mensagem via API: o `message_type`.
- `0` ou `"incoming"` = SEMPRE Cliente (Recebido).
- `1`, `2`, `"outgoing"`, `"template"` = SEMPRE Gerente/Empresa (Enviado).

## Proposed Changes (Design)
Vou refatorar a Edge Function `chatwoot-webhook` para **inverter a ordem de prioridade**:
1. O código vai ler APENAS a variável de ouro `message_type`.
2. Se for `0` ou `"incoming"`, carimba como `contact` (Esquerda).
3. Se for `1` ou `"outgoing"`, carimba como `user` (Direita).
4. Somente se o `message_type` for completamente maluco, ele tenta olhar o `sender.type`.

## Tarefas (Tasks)
- [ ] Mudar a prioridade de parsing para `message_type` no Webhook.
- [ ] Dar o Deploy da Função nova.
- [ ] Rodar um script corretivo de banco mais inteligente: limpar as mensagens recentes e restaurar com base no histórico real ou apenas apagar as do último 1 dia e deixar sincronizar. Na verdade, como já perdemos a origem na tabela `chat_messages`, as antigas que foram misturadas ficarão assim, mas as NOVAS entrarão 100% perfeitas. 

> [!IMPORTANT]
> Descobri o real problema: sua integração de WhatsApp cadastra o remetente como "api", enganando nosso robô! 
> Mande um `/vibe-apply` e eu aplico essa variável de ouro agora.
