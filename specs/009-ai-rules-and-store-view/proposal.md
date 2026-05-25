# Requisitos e Contexto

## Problema
O sistema precisa de refinamentos lógicos na IA e visibilidade granular:
1. **Regras de Auditoria:** O critério de envio do checklist em link está desconectado da avaliação do orçamento. A aprovação do cliente precisa ser dependente do envio do checklist/orçamento.
2. **Qualidade de Vídeo e Áudio (Deep Analysis):** Vídeos muito curtos (abaixo de ~3 minutos) geralmente indicam falta de profundidade na explicação técnica. A IA não deve dar a nota máxima de "explicação" (2c, 3c) se o vídeo for muito raso. Além disso, a IA deve **transcrever nativamente** os áudios e vídeos (aproveitando o Gemini 1.5) para validar se o mecânico realmente explicou *TUDO* e justificou o valor, não apenas se a mídia existe.
3. **Visão Restrita por Loja:** Gerentes de loja precisam ver os dashboards e o histórico para auditar suas próprias unidades, sem poder editar as configurações globais ou ver dados de outras franquias.
4. **Golden RAG (Exemplo Positivo):** A IA precisa de um norte claro. Usar a unidade "Carijós" como padrão ouro para calibrar a inteligência.

## Objetivos
- Atualizar o *System Prompt* do `ai-autonomous-evaluator` com lógica condicional ("sim" só vale após orçamento) e um exemplo "Few-Shot" simulando um atendimento nota 100 da unidade Carijós.
- Alterar as lógicas do Frontend (`App.tsx`, rotas) para permitir "Visualização por Loja".
- Ativar avaliação profunda multimodal: obrigar a IA a transcrever áudios/vídeos para pontuar as etapas E2 e E3 com base na riqueza de detalhes e profundidade técnica da explicação.

## BDD Scenarios

### Cenário: Aprovação Sem Orçamento
- **Given:** O cliente diz "Pode aprovar" antes de o mecânico enviar o link do checklist/orçamento.
- **When:** A IA avaliar a mudança de funil.
- **Then:** O funil não deve pular para `closed_won` (Ganho), porque a etapa 1 e 2 ainda não foram cumpridas pelo mecânico.

### Cenário: Visão de Gerente de Unidade
- **Given:** Um usuário com cargo de "Unit Manager" loga no CRM.
- **When:** Ele tenta acessar a tela principal de Relatórios.
- **Then:** O seletor de "Unidades" fica travado na loja dele, os KPIs gerais somem, e ele só enxerga a própria performance e seus próprios logs, sem poder alterar os prompts da IA.
