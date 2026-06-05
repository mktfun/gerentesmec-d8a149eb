# Proposta: Correção da Lógica de Finalização Precoce (AI Evaluator)

## 1. O Problema (A Raiz do Bug de 80%)
Atualmente, o prompt do Agente Avaliador (Edge Function `ai-autonomous-evaluator`) está instruído a mover o funil para `closed_won` (Finalizada) **no exato momento em que o cliente diz "Pode Fazer" ou "Aprovado"**.

**O que acontece na prática:**
1. O gerente manda o orçamento (08:29).
2. O cliente diz "Serviço autorizado" (08:32).
3. A IA lê "Serviço autorizado", segue a regra cega do prompt e decreta: "Ah, fechou negócio! `closed_won`".
4. Ao entrar em `closed_won`, o sistema **fecha a nota da auditoria**. Como o carro acabou de começar a ser consertado, o gerente obviamente ainda não enviou fotos do conserto (Passo 3) nem mandou mensagem de agradecimento/avaliação do Google (Passo 4).
5. Resultado: O gerente toma nota 80% (ou menos) injustamente.

Outro problema detectado: Quando a IA lê um lote misto de mensagens (Gerente + Cliente), ela às vezes foca no insight do gerente e esquece de marcar a caixinha `2e` (Aprovação do cliente), apesar de notar a aprovação no texto.

## 2. Requisitos de Correção
- **Redefinição do Gatilho de `closed_won`**: A IA só pode marcar o lead como "Ganho/Finalizado" (`closed_won`) quando o carro for efetivamente **entregue** e a conversa **encerrada** (Ex: "Obrigado pela preferência, aqui está o link do Google").
- Enquanto o serviço foi aprovado e o carro está na oficina, o status deve ser **Em Atendimento (`negotiation`)**.
- Melhorar o JSON de saída da IA para lotes mistos (`mixed`) garantindo que ela analise as caixas de seleção independentemente de quem falou por último no lote.

## 3. BDD Scenarios

### Cenário 1: Cliente aprova o orçamento, o carro vai para a oficina
- **Given:** O lead está em `quote` (Orçamento Enviado) e o gerente enviou o orçamento.
- **When:** O cliente responde "Bom dia! Serviço autorizado".
- **Then:** A IA marca o item `2e` (Obteve aprovação) como TRUE, e **MUDA** o funil de volta para `negotiation` (Em Atendimento). O score não é finalizado e o lead continua aguardando os passos 3 e 4.

### Cenário 2: Serviço concluído, gerente finaliza a conversa
- **Given:** O lead está em `negotiation` com o serviço aprovado.
- **When:** O gerente manda: "Seu carro tá pronto! Valeu pela confiança, avalia a gente no Google: [LINK]".
- **Then:** A IA marca `4a` e `4b` como TRUE, e muda o funil para `closed_won`. O score é fechado com 100%.

## 4. Dúvida de Negócios (Para validação do usuário)
Para resolver de vez: Quando o cliente diz "Aprovado", você prefere que o card no Kanban **volte para a coluna "Em Atendimento"** (onde fica aguardando o gerente mandar fotos do conserto), ou você quer que eu crie uma coluna nova chamada **"Em Execução / Aprovado"**? 
*(Se criar coluna nova, mexeremos no BD. Se voltar para Em Atendimento, mexemos só no prompt e resolvemos em 5 minutos).*
