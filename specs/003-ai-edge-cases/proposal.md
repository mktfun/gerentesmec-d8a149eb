# Proposal: 003-ai-edge-cases

## 1. Visão Geral (RPI-R)
Conforme solicitado, rodamos uma simulação estrutural pesada (Script `simulate-ai`) forçando dois cenários de clientes no banco:
- **Dom Pedro:** Caminho feliz (100%), vídeos e links enviados.
- **Jabaquara:** Caminho ruim (20%), seco e sem etapas cruciais.

A simulação e a inspeção da arquitetura revelaram que a IA "pura" falharia miseravelmente em produção devido a Gargalos de Borda (Edge Cases). Esta spec visa blindar a automação para que ela realmente funcione.

## 2. Requisitos e Edge Cases Identificados
1. **Falha Multimídia (Cegueira da IA):** O Webhook atual não repassa links de vídeo (`media_url`) do Chatwoot de forma que a IA consiga identificar. A IA penalizaria o gerente dizendo que ele "não mandou o vídeo", mesmo ele tendo mandado.
2. **Race Conditions (Sobrecarga de Webhook):** Se o gerente mandar 5 mensagens seguidas no WhatsApp, o Webhook é chamado 5 vezes simultâneas. A IA tentaria comprimir o histórico 5 vezes, sobrescrevendo a memória do banco de dados de forma caótica.
3. **Erros de Tipagem JSON:** O LLM do Gemini pode devolver `ticket_value_extraido` como número inteiro, string ou null. Precisamos de validação via `Zod` (ou regex seguro) antes de atualizar o Supabase para evitar "Type Mismatch".
4. **Motivação Invisível (Feedback ao Gerente):** A IA avalia e decide a nota, mas o motivo (`motivo`) fica perdido no log. O gerente de Jabaquara veria que tirou nota 20, mas não saberia *o porquê*.
5. **Falha Crítica do Vector DB:** A infraestrutura de Nuvem não ativou a extensão `pgvector`, causando falha fatal no `semantic_cache`.

## 3. BDD Scenarios

### Cenário: Envio Multi-Mensagem (Debounce)
- **Given:** O lead manda 4 mensagens consecutivas em 10 segundos.
- **When:** O webhook recebe as mensagens.
- **Then:** O sistema agrupa todas em um "Batch" usando um job temporário/cron e só chama a IA 1 vez, economizando tokens e evitando Race Condition na tabela `lead_memories`.

### Cenário: Justificativa Transparente (Motivo do Score)
- **Given:** O avaliador (IA) finaliza a leitura e dá 45% de nota.
- **When:** O gerente clica no card do CRM.
- **Then:** O `AuditPanel` exibe uma caixa destacada: *"Feedback da IA: O orçamento não foi detalhado e o vídeo do defeito não consta no histórico."*
