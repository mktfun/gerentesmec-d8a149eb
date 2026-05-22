# Proposal: AI Autonomous Funnel (Multi-Agent)

## Requisitos
1. A inteligência artificial deve ter o poder de movimentar os Leads entre as etapas do funil (`lead_new` -> `quote` -> `negotiation` -> `closed_won` / `closed_lost`) de forma 100% autônoma.
2. A arquitetura da IA deve evitar "Super Prompts". Deve existir um Roteador mestre (Cérebro Principal) que delega ações específicas para Mini-Cérebros especializados.
3. O código do webhook (`chatwoot-webhook`) deve deixar de forçar o estágio `quote` e transferir essa responsabilidade puramente para a cognição da IA.

## User Stories
- **Como gerente**, eu quero que o sistema detecte automaticamente quando eu envio o valor de um orçamento e mova o card do cliente para "Orçamento", para que eu não precise arrastá-lo manualmente.
- **Como gerente**, eu quero que a IA entenda se o cliente está chorando desconto ou questionando o orçamento, para mover o card automaticamente para "Em Negociação".
- **Como desenvolvedor**, eu quero que cada comportamento da IA (auditoria, funil, mídia) seja uma skill/agente isolado, para que eu possa evoluir um sem quebrar o outro (evitar poluição de contexto no LLM).

## BDD Scenarios

### Cenário: Cliente entra em fase de Negociação
- **Given (Dado):** Um lead está na etapa `quote` e acabou de mandar uma mensagem.
- **When (Quando):** O cliente escreve "Poxa, o valor ficou um pouco alto, consegue fazer um desconto à vista?". O *Router Brain* intercepta e classifica a intenção como `price_objection`. Ele delega para o *Funnel Brain*.
- **Then (Então):** O *Funnel Brain* atualiza a coluna `funnel_stage` para `negotiation` no Supabase, e o card do usuário desliza na tela automaticamente via tempo real.

### Cenário: Aprovação Clara do Serviço
- **Given (Dado):** Um lead está na etapa `negotiation` ou `quote`.
- **When (Quando):** O cliente escreve "Pode fazer, autorizo o serviço". O *Router Brain* classifica como `approval`. O *Funnel Brain* é acionado.
- **Then (Então):** O *Funnel Brain* atualiza a coluna `funnel_stage` para `closed_won`. (Isso, em cascata, engatilhará a outra Edge Function que gera o Dossiê final).

### Cenário: Conversa Fiada ou Dúvida Técnica Simples
- **Given (Dado):** Um lead está na etapa `quote`.
- **When (Quando):** O cliente escreve "Que horas vocês fecham hoje?". O *Router Brain* classifica a intenção como `faq` ou `casual`.
- **Then (Então):** Nenhum *Funnel Brain* é acionado para alterar estágio. O lead permanece inalterado no funil, apenas o *Auditor Brain* roda em background para ver se há alteração de cordialidade.

### Cenário: Validação de Ponta a Ponta com Logs Reais
- **Given (Dado):** A arquitetura multi-agente está em produção.
- **When (Quando):** O desenvolvedor injeta um payload de mock simulando Chatwoot via CLI.
- **Then (Então):** O console exibirá os logs ordenados: 1. `[Router Brain] Intent detectada: X`. 2. `[Funnel Brain] Atualizando lead_id Y para estagio Z`. 3. `[Auditor Brain] Score atualizado`. O banco de dados confirmará a alteração.
