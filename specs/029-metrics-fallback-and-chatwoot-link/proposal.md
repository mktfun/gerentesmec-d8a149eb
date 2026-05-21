# Proposal: Fallbacks, Chatwoot Link e Chart Fix

## Objetivos
1. Adicionar um fallback no cálculo do Tempo Médio de Resposta (TMR) para evitar que a tela fique com dados "zerados" e "feia" durante a transição para a nova estrutura de dados de timestamps, suportando tanto os leads antigos quanto os novos.
2. Inserir um atalho visual, discreto e premium, dentro do painel lateral do CRM para abrir a conversa do lead no Chatwoot em uma nova aba com 1 clique.
3. Corrigir a matemática de Média Global (gráfico e dashboard) para ser uma média ponderada real, e melhorar a visualização do gráfico do Recharts quando há poucos dados.
4. Aplicar a mesma lógica corrigida de métricas na tela de Relatórios.

## User Stories
1. Como gerente preenchendo o score, eu quero clicar em um botão "Abrir no Chatwoot" direto no CRM, para ler a conversa e julgar a qualidade mais rapidamente.
2. Como administrador, eu quero ver o gráfico de evolução calculando a nota global baseada em TODO o volume de orçamentos (e não a média das médias das unidades).
3. Como administrador, eu quero que o painel mostre algum TMR histórico razoável para os dados antigos, pra não parecer que o sistema quebrou e zerou tudo.

## BDD Scenarios

### Cenário: Clique no link do Chatwoot
- **Dado** que estou avaliando o lead Mario no Kanban e o painel lateral está aberto.
- **Quando** eu clico no ícone "Abrir Chatwoot".
- **Então** uma nova aba se abre diretamente na URL `https://[chatwoot]/app/accounts/[id]/conversations/[conv_id]`, já dentro do contexto daquela mensagem.

### Cenário: Cálculo da Média Global
- **Dado** que a unidade A tem nota 100 em 1 lead, e a unidade B tem nota 0 em 9 leads.
- **Quando** o sistema exibe a Média Global
- **Então** ela deve ser de 10% (100 pontos em 10 leads) e não 50% (média de 100 e 0).
