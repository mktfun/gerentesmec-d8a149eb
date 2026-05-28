# RPI-R: Research - Audit Reasoning and Link Scraping

## 1. Contexto e Problema Atual
O usuário relatou dois problemas principais com a IA avaliadora (`ai-autonomous-evaluator`):
1. **Falha na Extração de Links:** A extração automática de links enviados pelo mecânico (gerente) não parece estar funcionando para todos os casos, impedindo que o histórico da IA capture orçamentos/checklists externos de forma consistente.
2. **Falta de Justificativas Claras:** Quando a IA altera o funil de vendas (ex: movendo para Perda/Ganho) ou quando decide **não pontuar** um item do checklist (ex: cordialidade, explicação do orçamento), ela não fornece um motivo óbvio e objetivo. O mecânico acaba sem saber exatamente *o que* errou ou o que faltou falar para garantir a nota.

## 2. Análise do Código Atual

### 2.1. Lógica de Scraping (`index.ts`)
- **Regex Atual:** `/(https?:\/\/[^\s]+)/g`
  - *Problema:* Só captura links que comecem estritamente com `http://` ou `https://`. Se o mecânico digitar `oficinadomario.com.br/orcamento` ou `www.oficina.com.br`, o regex ignora.
- **Filtro de Remetente:** `if (urls.length > 0 && sender_type !== 'contact')`
  - O scraping acontece apenas para links enviados pelo gerente/bot (o que é correto, mas talvez o usuário deseje que links do cliente também sejam lidos, se relevante? A instrução foi "qualquer link do mecanico", o que confirma o foco nas mensagens do gerente). O verdadeiro culpado parece ser o Regex restrito.

### 2.2. Lógica de Avaliação e JSON Schema
- O prompt solicita um JSON com `audit_checklist` (booleanos), `score`, `funnel_stage`, `message_insight`, etc.
- **Problema:** Não existe um campo estruturado no JSON para armazenar *motivos granulares* (por que 1a foi false? por que 2b foi false?) nem para armazenar o motivo exato de uma transição de funil. O campo `message_insight` é geral e sobrescrito a cada mensagem, e `closing_summary` é um resumo narrativo da negociação toda, não granular.
- **Tabela `leads` (Supabase):** Atualmente possui `audit_checklist` e `audit_checklist_messages`. Precisaremos expandir a tabela para armazenar os novos metadados textuais para o frontend renderizar.

## 3. Conclusão da Pesquisa
Para resolver as dores do usuário, devemos:
1. Ampliar o regex de extração de links para capturar domínios sem protocolo.
2. Alterar o esquema JSON de saída do LLM no edge function para incluir `stage_change_reason` e `audit_reasons` (um dicionário mapeando o ID da etapa para a justificativa).
3. Modificar o DB (Supabase) adicionando duas novas colunas na tabela `leads`.
4. Atualizar o frontend (`AuditPanel` e `ManagerAuditInspector`) para exibir as justificativas de forma transparente, permitindo que a equipe de mecânicos melhore seu atendimento baseando-se no feedback direto da IA.
