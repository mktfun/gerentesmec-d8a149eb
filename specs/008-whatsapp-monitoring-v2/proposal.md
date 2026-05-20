# Proposal: WhatsApp Monitoring v2 (Surdina)

## 1. Visão Geral
O sistema de monitoramento será refeito para operar de forma **100% furtiva**. A tela principal NÃO deve conter nenhuma palavra como "Chatwoot", "Monitoramento" ou similar. Ela deve ser uma página neutra ou um dashboard trivial inofensivo. O módulo real será acessado por uma rota secreta (ex: `/hermes-vault`).
A interface Kanban deve ser esteticamente impecável, inspirada no `conciliamec.lovable.app`, mas muito mais interativa ("viva"). A implementação iniciará focada **exclusivamente no frontend e UX (com dados mockados)** em localhost, priorizando animações, transições e detalhes visuais antes de integrar o backend do Supabase.

## 2. Requisitos Funcionais
- **Acesso Furtivo Absoluto:** Zero exposição de nomes como "Chatwoot". Acesso exclusivamente por rota secreta ou atalho.
- **Desenvolvimento Frontend-First:** A UI será construída e aperfeiçoada com mocks antes de ligar o banco. Foco absoluto em animações de números (counting up), transições de card (framermotion-like), fade-ins de painéis laterais.
- **Painel Kanban de Atendimentos:** Visualização em colunas representando o status do cliente.
- **Drill-down por Unidade:** Ao clicar em uma unidade, o auditor vê o histórico de conversas, proofs (provas: links de vídeos, orçamentos) e os pontos de falha do gerente.
- **Score Dinâmico (0-100):** Cálculo de pontuação com peso igual (25% cada) para as 4 etapas.
- **Alerta de SLA (Intervenção):** Destaque visual (vermelho/em chamas) para leads sem resposta há mais de 20 minutos ou retornos de clientes ignorados.
- **Comparativo de Reviews:** Módulo analítico comparando a Etapa 4 (fechamentos via WhatsApp) com os dados recebidos do Google Meu Negócio.

## 3. User Stories
1. **Como Auditor (João)**, eu quero acessar o painel de monitoramento através de uma URL secreta, para que ninguém na empresa saiba que estou utilizando a ferramenta antes da hora.
2. **Como Auditor (João)**, eu quero ver os atendimentos atuais das unidades em um quadro Kanban, para entender rapidamente quem está aguardando resposta e quem está atrasado (> 20 min).
3. **Como Auditor (João)**, eu quero poder auditar um atendimento e marcar se as 4 etapas (Cordialidade, Orçamento c/ Vídeo, Checklist Complementar, Review Google) foram seguidas, para que o sistema gere a nota de 0 a 100 do gerente.
4. **Como Auditor (João)**, eu quero poder anexar anotações e provas (links) no card de auditoria para montar o dossiê que apresentarei futuramente.

## 4. Critérios de Aceite
- A tela principal `/` não contém links óbvios para o monitoramento.
- A tela Kanban possui colunas de triagem (ex: "Entrada", "Em Andamento", "Estourou SLA", "Concluído").
- Os cards do Kanban exibem o tempo de resposta e ficam em destaque se ultrapassar 20 minutos.
- A nota de 0 a 100 deve refletir exatamente 4 checkboxes das 4 etapas. Se 2 etapas forem cumpridas, a nota do atendimento é 50.

## 5. BDD Scenarios

### Cenário: Auditoria furtiva de um ciclo de atendimento completo
- **Given (Dado):** O auditor (João) acessou o painel através da rota secreta `/vault`.
- **When (Quando):** Ele avalia o atendimento do "Jorge Bereta" e marca as etapas 1, 2 e 4 como concluídas, mas falha a etapa 3 (Checklist Complementar).
- **Then (Então):** O sistema deve registrar o atendimento, gravar o histórico de anotações do João e calcular o Score de Atendimento em 75%.

### Cenário: Estouro de Tempo de Resposta (Intervenção Necessária)
- **Given (Dado):** Um novo lead chama a unidade Dom Pedro pelo WhatsApp.
- **When (Quando):** Passam-se 20 minutos e o gerente não envia nenhuma resposta.
- **Then (Então):** O card deste lead no Kanban deve pular para a coluna "Ação Imediata (SLA Estourado)" e piscar em vermelho para que o auditor intervenha manualmente e salve a venda.

### Cenário: Rastreabilidade de Google Reviews (Furos)
- **Given (Dado):** A unidade Jabaquara teve 20 auditorias com a "Etapa 4 (Agradecimento e Pedido de Review)" validada no mês.
- **When (Quando):** O painel consolida os dados com o GMB que relata apenas 15 avaliações novas recebidas.
- **Then (Então):** O painel deve exibir um aviso de "Divergência: 5 avaliações perdidas (Furo)" para investigação.
