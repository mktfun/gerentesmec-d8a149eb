# Especificação de Desenvolvimento (SDD): Auditoria Master (Skill Definitiva)

## 1. O Problema
A auditoria mensal manual ou semi-automatizada atual sofre de 3 problemas graves:
1. **OS Abertas:** O sistema não entende quando o carro ainda está no elevador, desclassificando o gerente injustamente.
2. **Histórico Quebrado:** Links e vídeos enviados semanas atrás somem do histórico por falta de paginação profunda da API, gerando alucinações na IA que penaliza o gerente dizendo que ele não enviou o link.
3. **Looping Perigoso:** Tentar forçar o sistema a achar exatamente as "3 piores" em meses fracos gera um desperdício de chamadas e leitura.

## 2. A Solução (O Veredito do Conselho)
Esta Skill atuará como um **Pipeline Híbrido de Two-Step Verification**.

### Arquitetura:
- **Phase 1: O Extrator Pesado (Node.js)** 
  - Varre todas as mensagens (com loop de paginação real) de cada unidade. 
  - Exclui conversas com menos de 15 mensagens no total (Entropia Mínima) ou com a tag `ignorar`.
  - Separa o Top 20 de conversas mais densas por unidade.
  
- **Phase 2: O Gatekeeper Flash (LLM Passo 1)**
  - Lê a transcrição dessas 20 conversas usando um modelo rápido/barato e devolve um JSON binário: `{"is_finalizada": true/false}`.
  - Se for false, joga a conversa no lixo sem perder tempo.

- **Phase 3: O Auditor Juiz Anti-Alucinação (LLM Passo 2)**
  - Pega as finalizadas e aplica a auditoria das 100 notas (Checklist, Vídeo, Aprovação).
  - **A Trava (Quote-Based):** Se o Auditor disser "O gerente não enviou o link", o código Node.js (Cético) fará um Regex simples procurando por "http" nas falas do gerente. Se achar, ele bloqueia a nota e avisa: "Alucinação Detectada, refaça!". O LLM será OBRIGADO a extrair a citação exata para dar penalidade.

- **Phase 4: Degradação Graciosa e Relatório**
  - O script ordena as conversas pelas notas menores e escolhe até 3 piores. Se só achar 2 piores (as outras foram boas ou descartadas), ele emite o relatório HTML com 2, sem forçar um loop infinito na API.

## 3. Plano de Tarefas (Tasks)
- [ ] Criar o script `run_monthly_audit.mjs` com as 4 fases.
- [ ] Implementar a paginação infinita da API Chatwoot (para pegar todo o histórico até a primeira mensagem).
- [ ] Construir o Prompt de JSON Duplo (O Gatekeeper e o Auditor Juiz com exigência de `evidencia_literal`).
- [ ] Adaptar o `build_html_v5.mjs` para gerar o HTML do relatório consumindo esse novo output JSON infalível.

## 4. Aprovação Necessária
Por favor, analise as travas (Phase 2 e Phase 3). Com essa mecânica, garanto que o robô NUNCA mais vai deduzir que algo faltou se o link estiver lá dentro, e OS abertas baterão no Gatekeeper e morrerão na praia. 
Se estiver de acordo, por favor, me dê o `Proceed` e eu aplico esse Vibe-Proposal no projeto.
