# Proposal: Fix Cumulative Scoring and UI Unlocking

## Requisitos
- **Frontend (UI):** O componente de checklist no `AuditPanel` deve ser interativo e destravado mesmo com `auto_scoring` ativado, de forma que o gerente possa reavaliar algo manualmente caso queira. O aviso "Avaliação Fechada" deve ser removido.
- **Backend (Edge Function):** A avaliação do LLM deve ser cumulativa (Append-Only para True). Se o banco de dados tem um critério já avaliado como verdadeiro (true), ele não deve nunca virar falso (false) apenas porque o LLM não achou aquele critério na mensagem atual. O mesmo vale para valores como orçamento (`ticket_value`) e veículo (`customer_vehicle`); se a IA retornar null, o dado não será sobrescrito.
- **Lógica de Pontuação (Score):** O score não deve ser deixado a cargo da alucinação do LLM. O backend deve calcular a nota dinamicamente iterando pelas chaves da `audit_checklist` preenchida como `true` e somando os valores de peso definidos em `aiSettings.evaluation_criteria`.

## BDD Scenarios

### Cenário: Destravamento Visual do Checklist
- **Given (Dado):** O sistema está configurado com `auto_scoring: true`.
- **When (Quando):** O gerente clica para abrir a aba do Dossiê / AuditPanel.
- **Then (Então):** O componente de checklist aparece sem máscara opaca, e o usuário consegue clicar e marcar caixas de seleção, independentemente da IA agir por trás.

### Cenário: Cumulatividade do Checklist
- **Given (Dado):** O card do funil possui `{"1a": true}` preenchido no banco de dados em uma mensagem anterior.
- **When (Quando):** O cliente envia uma nova mensagem trivial ("ok"), disparando o avaliador autônomo, que devolve `{"1a": false}`.
- **Then (Então):** A Edge Function une o estado local e os dados do banco e preserva `{"1a": true}` no banco de dados. O score final se mantém intacto.

### Cenário: Preservação de Valores Críticos (Orçamento e Veículo)
- **Given (Dado):** O card já possui o `ticket_value` de 4000 e `customer_vehicle` "Civic".
- **When (Quando):** O cliente envia a mensagem "Qual a chave PIX?". A IA devolve `{"ticket_value": null, "customer_vehicle": null}`.
- **Then (Então):** O backend ignora a resposta `null` do LLM e mantém o valor 4000 e "Civic" intactos no banco de dados.

### Cenário: Cálculo Criptográfico do Score
- **Given (Dado):** O `evaluation_criteria` atribui 25 pontos ao bloco 1 (com 2 critérios de 12.5 pontos cada). A IA avalia "1a" como `true` e o resto `false`.
- **When (Quando):** O backend vai registrar o payload final no Supabase.
- **Then (Então):** O backend calcula o `score` somando 12.5 pontos em memória, ignorando completamente qualquer número flutuante que o LLM enviou para a propriedade `score`, salvando 12.5 no banco.
