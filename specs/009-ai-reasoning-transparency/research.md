# Pesquisa: Transparência e Observabilidade em IA (LLM-as-a-Judge)

## Contexto e Pedido do Usuário
O usuário deseja que a avaliação do gerente feita pela IA não deixe "ônus da dúvida". Os gerentes questionam o porquê de terem recebido certas notas. O usuário quer uma interface e uma lógica 100% claras, descritivas e irrefutáveis, seguindo boas práticas do mercado para IA avaliadora ("LLM-as-a-judge").

## Melhores Práticas da Indústria (Pesquisa Web)
1. **Chain-of-Thought (CoT) Exposto:** A IA deve justificar seu pensamento *antes* de dar a nota. O backend já faz isso (`reasoning_step_by_step`), mas a UI atual esconde isso do usuário. Precisamos exibir o "Raciocínio Bruto da IA".
2. **Decomposição em Checklists (QAG):** Uma nota única de "0 a 100" é inexplicável. A nota deve ser a soma de pequenos checkboxes binários (Sim/Não). O sistema já possui a tabela `audit_checklist`, o que nos coloca perfeitamente alinhados com o estado da arte.
3. **Traceability (Rastreabilidade de Evidências):** Quando a IA diz que o gerente "Enviou o Orçamento", ela deve apontar *exatamente qual mensagem da conversa* prova isso. O backend atual já mapeia isso (`audit_checklist_messages`), precisamos de um link visual na UI que role o chat até a mensagem probatória.
4. **Human-in-the-loop (Override):** Se o gerente discordar e provar que está certo, o admin (usuário) precisa ter o poder de "Sobrescrever" a nota da IA e corrigir o checkbox, gerando um "Override Log" que prova que houve auditoria humana.

## O Que Falta no Sistema Atual?
A fundação de backend está **100% pronta e aderente ao estado da arte**.
A deficiência atual é puramente de UI/UX (Frontend):
- O componente `ManagerAuditInspector` não exibe a "Evidência" (a mensagem específica que acionou o checkbox).
- Não há exibição clara das `audit_justifications` ao lado dos itens que falharam.
- O campo `ai_insight` (resumo de raciocínio da IA) e `reasoning_step_by_step` não estão em destaque como o "Laudo da IA".

## Solução Proposta
Uma aba nova no painel de auditoria do CRM chamada **"Raio-X da IA"** ou a expansão do componente de checklist atual para adotar o padrão "Evidence-Based UI".
