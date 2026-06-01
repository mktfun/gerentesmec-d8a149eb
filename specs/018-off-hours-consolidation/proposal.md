# Requisitos e BDD - Spec 018

## Visão Geral
Modificar o comportamento da Avaliação Autônoma (AI Evaluator) para não gastar recursos ou alertar a cada mensagem fora do horário de expediente. Em vez disso, o sistema fará uma avaliação consolidada matinal (ou em lote) para gerar um Resumo Diário (Daily Digest), fornecendo ao gerente uma leitura executiva sobre o que ocorreu enquanto a loja esteve fechada, bem como rodando a auditoria da IA de forma massiva.

## Requisitos de Negócio
1. **Silêncio Fora do Expediente:** Mensagens que chegam fora da janela de `business_hours` configurada na loja **não** disparam a edge function `ai-autonomous-evaluator` na mesma hora. Elas apenas são salvas no banco de dados.
2. **Consolidador Diário:** Uma nova rotina em lote percorrerá todas as conversas pendentes. O sistema deve acionar o evaluator normalmente para processar a "fila pendente".
3. **Daily Digest:** Como etapa final dessa consolidação em lote, a IA analisará o conjunto de tudo que foi avaliado naquela noite/fim de semana e gerará um relatório textual de "Resumo Matinal".
4. **Relatório Visível e Discreto:** O gerente deve conseguir ver o "Daily Digest" na interface e também ter um botão "Executar Avaliação Matinal Agora" em Configurações > IA para testes/acionamento manual.

## BDD Scenarios

### Cenário: Cliente envia mensagem no domingo à noite
- **Given (Dado):** O horário de expediente é de Segunda a Sexta, das 08h às 18h.
- **When (Quando):** Um cliente envia uma mensagem via WhatsApp no Chatwoot às 22h do domingo.
- **Then (Então):** O `chatwoot-webhook` salva a mensagem na tabela `chat_messages`, atualiza o `last_client_message_at`, mas **NÃO** faz a requisição para invocar a Edge Function `ai-autonomous-evaluator`. O lead fica na "fila pendente".

### Cenário: Consolidação Matinal executada com sucesso
- **Given (Dado):** Há 3 leads com mensagens pendentes não avaliadas de fora do expediente.
- **When (Quando):** A Edge Function `ai-daily-consolidator` é executada (seja via botão manual ou cronjob).
- **Then (Então):** A função invoca a avaliação individual de cada um dos 3 leads. Após isso, junta o histórico dessas conversas noturnas e envia ao LLM gerando o "Daily Digest". Este relatório fica salvo na tabela `daily_digests`.

### Cenário: Leitura do Daily Digest pelo Gerente
- **Given (Dado):** O resumo foi gerado.
- **When (Quando):** O gerente clica na aba "Daily Digests" na UI.
- **Then (Então):** Ele vê uma interface em lista estilo "Caixa de Entrada", onde o resumo mais recente apresenta quais leads interagiram na noite, as eventuais falhas (ex: IA notou atendimento atrasado ou resposta errada) e a recomendação matinal.
