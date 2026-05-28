# Proposal: Audit Reasoning and Enhanced Scraping (011)

## 1. Visão Geral
A funcionalidade **011-audit-reasoning-and-scraping** visa tornar a IA Avaliadora totalmente transparente e mais inteligente. Atualmente a IA apenas aponta o dedo (marcando true ou false), mas o objetivo agora é que ela aja como um treinador: se uma pontuação for negada ou se um lead for dado como perdido, ela fornecerá um motivo objetivo, curto e referenciando partes do texto. Além disso, o scraping de orçamentos enviados pelos mecânicos se tornará mais flexível para reconhecer links sem o protocolo explícito.

## 2. Requisitos de Negócio (Business Requirements)
- **BR1:** O regex de captura de URLs do Jina Reader deve capturar URLs comuns mesmo sem "http://" (ex: `www.oficina.com/orcamento`, `oficina.app.com/123`).
- **BR2:** A IA deve retornar um motivo textual sempre que mudar o estágio do funil (em especial `closed_lost` e `closed_won`). Se não mudar, retorna `null`.
- **BR3:** A IA deve retornar um mapa/dicionário explicando o **motivo do erro/omissão** para cada item do checklist que for avaliado como `false` (ou até os acertos notáveis, mas com foco em justificar falhas usando exemplos do chat).
- **BR4:** As justificativas geradas devem ser curtas, diretas, coerentes e 100% entendíveis pelo usuário (mecânico) na UI do painel.

## 3. User Stories
- **US1:** Como gerente/mecânico, eu quero enviar links curtos (sem https://) para meus clientes e quero que a IA seja capaz de raspá-los para analisar meu checklist no histórico.
- **US2:** Como mecânico, eu quero ver exatamente o porquê de eu não ter ganhado a pontuação de "Cordialidade" ou "Explicação de Defeito", para que eu saiba como melhorar nos próximos atendimentos.
- **US3:** Como dono da oficina, quero saber imediatamente por que a IA classificou uma conversa como "Perdida", lendo a justificativa clara extraída do diálogo com o cliente.

## 4. Critérios de Aceite (Acceptance Criteria)
- Regex na Edge Function modificado para suportar formatos de domínio convencionais.
- O JSON de resposta da API possui as chaves `"stage_change_reason"` (string | null) e `"audit_reasons"` (objeto json).
- A tabela `leads` aceita as duas novas colunas acima.
- A UI renderiza as justificativas abaixo ou ao lado dos checkboxes do audit na tela de detalhes.

## 5. BDD Scenarios

### Cenário: Extração de Link Flexível
- **Given (Dado):** O mecânico envia a mensagem "Segue seu orçamento: mecanicax.com.br/orcamento/333".
- **When (Quando):** A Edge Function intercepta a mensagem.
- **Then (Então):** A URL `mecanicax.com.br/orcamento/333` é extraída, o protocolo `https://` é inferido, e a API do Jina Reader processa o conteúdo com sucesso.

### Cenário: Justificativa de Perda (Closed Lost)
- **Given (Dado):** O cliente diz "Ficou muito caro, não vou fazer o serviço agora".
- **When (Quando):** A IA avalia a mensagem e atualiza o funil.
- **Then (Então):** A IA define `funnel_stage` como `closed_lost` e preenche `stage_change_reason` com "Cliente rejeitou devido ao preço alto ('Ficou muito caro').".

### Cenário: Justificativa de Item Falho no Checklist
- **Given (Dado):** O mecânico finaliza o atendimento (Ganho) mas em nenhum momento enviou áudio/vídeo detalhando a causa do problema da suspensão.
- **When (Quando):** A IA avalia toda a conversa no fechamento.
- **Then (Então):** A IA marca os itens `2c` ou `2d` como `false` e no objeto `audit_reasons["2c"]` escreve: "O defeito não foi explicado. Faltou o envio de evidências como vídeos ou fotos para validar o problema na suspensão.".
