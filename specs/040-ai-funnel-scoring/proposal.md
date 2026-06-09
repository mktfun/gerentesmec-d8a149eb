# 040 - AI Funnel Scoring & Manual Overrides

## Background & Objetivos
Atualmente, a IA Autônoma avalia todo o checklist e pontuação (score) em cada nova mensagem trocada. Isso gera redundância, eleva o custo de tokens e, às vezes, a IA regride a etapa do funil de vendas (ex: volta um lead de \`negotiation\` para \`quote\` incorretamente).
Além disso, a interface bloqueia o Gerente/Admin de modificar a pontuação ou marcar os itens do checklist manualmente.

O usuário solicitou:
1. **Desbloqueio Manual:** Permitir que humanos alterem o checklist e deem o score diretamente pelo \`AuditPanel.tsx\`.
2. **Avaliação Focada (Cost Reduction):** Durante o funil, a IA deve focar apenas na **Evolução da Etapa** e extração de dados (veículo, valor do orçamento). A IA só deverá preencher o checklist e dar a pontuação **uma única vez**, quando a etapa mudar para \`closed_won\` ou \`closed_lost\`.
3. **Trava Antirregressão:** Impedir via código que a IA volte um lead para uma etapa anterior. O funil deve apenas progredir.

## User Stories
- Como **Admin**, quero poder clicar nos itens do checklist no CRM para forçar a marcação (Conforme/Não Conforme) e ver o score atualizar dinamicamente.
- Como **Gestor do Sistema**, quero que a IA pare de gastar tokens justificando checklists de conversas que ainda não acabaram.
- Como **Gerente de Oficina**, quero ter certeza de que um lead que entrou em "Negociação" não volte magicamente para "Novo Lead".

---

## BDD Scenarios

### Cenário 1: Progressão de Etapa sem Regressão
- **Given (Dado):** O lead está na etapa \`quote\` (Orçamento Enviado).
- **When (Quando):** A IA avalia uma nova mensagem do cliente e se confunde, sugerindo que a etapa seja \`lead_new\`.
- **Then (Então):** O sistema deve interceptar a decisão, ignorar a regressão e manter a etapa como \`quote\` ou superior.

### Cenário 2: Avaliação Limitada durante a Jornada
- **Given (Dado):** O lead está em \`negotiation\` (Negociação).
- **When (Quando):** Uma nova mensagem é enviada e a IA analisa o contexto.
- **Then (Então):** A IA atualiza a etapa (se progrediu), extrai ticket/veículo, mas **não** avalia nem envia justificativas para os itens de checklist (deixando o processamento mais leve e barato).

### Cenário 3: Avaliação Completa no Fechamento
- **Given (Dado):** O lead atingiu a etapa \`closed_won\`.
- **When (Quando):** A Edge Function de avaliação autônoma é disparada.
- **Then (Então):** A IA, sabendo que a conversa terminou, fará uma análise profunda de todo o histórico, preenchendo todos os 12 itens do checklist e gerando o Score Final.

### Cenário 4: Intervenção Manual no AuditPanel
- **Given (Dado):** O Admin está visualizando o dossiê de um lead.
- **When (Quando):** Ele clica sobre um item específico do checklist (ex: "Enviou vídeo educativo") que estava como \`false\`.
- **Then (Então):** O item marca como \`true\`, e o "Score Ring" (círculo de pontuação) atualiza automaticamente para a nova nota baseada nos pesos.

> [!WARNING] User Review Required
> Por favor, revise se concorda com a regra de antirregressão: a ordem do funil será estritamente \`lead_new\` -> \`quote\` -> \`negotiation\` -> \`closed_won\` / \`closed_lost\`. Confirma que não há casos de negócio válidos para um lead voltar, por exemplo, de "Negociação" para "Novo Lead"?
