# Proposal: 005-reports-and-ai-closure

## Requisitos
1. **Dossiê (Parecer de Fechamento) e Dados por IA:** A inteligência artificial deve produzir e preencher o `closing_summary` da tabela `leads` de forma autônoma. Além disso, deverá extrair e preencher o `ticket_value` (valor do orçamento) e o `customer_vehicle` (veículo do cliente) a partir do histórico da conversa.
2. **Correção de Mídias de Imagem:** A interface de chat do CRM deve conseguir renderizar mídias recebidas como `image/jpeg` ou `image/png` (atualmente a sintaxe estrita quebra o componente).
3. **Novos Filtros no Relatório:**
   - Filtro de Unidades (Multi-select ou Dropdown).
   - Filtro de Ordenação por SLA (Exibir os mais críticos/estourados primeiro).
   - Filtro de Ordenação por Score (Melhores scores primeiro ou Piores scores primeiro).

## User Stories
- **Como Administrador/Gerente Master**, quero poder filtrar a tela de Relatórios para investigar o desempenho específico de uma Unidade, ou para ver apenas os atendimentos com piores scores para aplicar treinamento na equipe.
- **Como Operador/Gerente**, quero que as imagens de orçamentos e peças danificadas enviadas pelo cliente no WhatsApp apareçam no CRM sem quebrarem ou sumirem, para que o contexto visual não seja perdido.
- **Como Auditor**, quero ler um Parecer de Fechamento consolidado redigido pela IA (Dossiê) que resume de ponta a ponta como foi a negociação, os erros e acertos.

## BDD Scenarios

### Cenário: Exibição de Imagens Recebidas
- **Given (Dado):** O lead enviou uma foto de uma suspensão quebrada via WhatsApp/Chatwoot com o mime type `image/jpeg`.
- **When (Quando):** O gerente abrir o dossiê do lead e olhar o painel de histórico de chat.
- **Then (Então):** A imagem deve ser renderizada na íntegra no balão da conversa do cliente, mantendo o layout fluido.

### Cenário: Geração do Parecer e Dados pela IA
- **Given (Dado):** Uma negociação foi encerrada e a Edge Function Evaluator foi ativada. No histórico, há menções sobre "Cobrar 1500 reais" para consertar o "Honda Civic".
- **When (Quando):** A Edge function montar o payload de resposta ao frontend.
- **Then (Então):** O backend gravará na tabela `leads` o dossiê na coluna `closing_summary`, preencherá `ticket_value` com 1500 e `customer_vehicle` com "Honda Civic". O alerta "Aguardando parecer..." sumirá e os inputs no Dossiê serão auto-preenchidos.

### Cenário: Filtragem na Tela de Analytics
- **Given (Dado):** A tela `Relatorios.tsx` possui dezenas de auditorias na tabela inferior e gerentes rankeados.
- **When (Quando):** O usuário master selecionar a Unidade "Dom Pedro" e ordenar por "Pior Score".
- **Then (Então):** A tabela de performance, as métricas e a tabela inferior refletirão exclusivamente os leads de "Dom Pedro" organizados de baixo para cima nas notas, recalculando as médias ativas.
