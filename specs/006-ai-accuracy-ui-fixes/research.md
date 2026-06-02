# Fase Research (RPI-R) — Pesquisa e Contexto

## 1. Mapeamento do Problema
O usuário relatou que a Inteligência Artificial do CRM não apenas comete falhas visuais, mas demonstra séria "burrice" ou falta de interpretação textual profunda.
Problemas específicos:
1. **Regressão e Alucinação de Funil (Funnel Stage Reverting):** Leads regridem de etapa por respostas triviais do cliente. Pior: a IA interpreta mal falas do mecânico (ex: deduzir que o cliente aprovou o serviço, "recebeu ok do cliente pro serviço?", a partir de uma fala sem sentido).
2. **Falsos Positivos Crônicos (Checklist 4a e outros):** A IA não entende o contexto de encerramento. Pontua agradecimento e pedido de avaliação antes da hora.
3. **Falta de Interpretação Complexa:** A IA falha em entender gírias, comunicação informal de oficina e intenções implícitas. Fica presa a uma análise superficial e apressada.
4. **UI Intrusiva e Resumos de Áudio:** (Mapeado anteriormente) UI gigante para anotações e resumos de áudio desaparecidos.

## 2. Diagnóstico do LLM (Gemini 2.5)
A falha na interpretação não ocorre por "burrice" do modelo raiz (Gemini 2.5 Flash), mas pela forma como o *Prompt Engineering* foi construído. Atualmente:
- A IA toma decisões diretamente para o JSON de saída **sem racionalizar antes**. Isso causa alucinações (violação do princípio *Chain-of-Thought*).
- O contexto fornecido é resumido (`compressedHistory`), e a instrução sobre como interpretar a mecânica de aprovação de orçamento não possui *Few-Shot Examples* com gírias ou erros comuns.

## 3. Melhores Práticas de Prompt Engineering (Auditoria)
Com base em pesquisa recente para LLMs de auditoria:
- **Chain-of-Thought (CoT) Forçado:** A IA *deve* gerar um campo `reasoning_step_by_step` *antes* de gerar os booleanos e a etapa de funil. Fazer o modelo "pensar alto" obriga-o a ler o histórico e cruzar com as restrições, aumentando a precisão em até 80%.
- **Negative Constraints Explícitas:** Dizer à IA o que *não* fazer é vital. Exemplo: "Um 'ok' do cliente antes do envio do PDF de orçamento NÃO significa aprovação (closed_won)."
- **Separação de Identidade:** O LLM precisa atuar com a persona de um "Auditor Sênior Implacável".

## 4. Estratégia de Solução Definitiva
- **Reengenharia Total do Prompt (`ai-autonomous-evaluator`):**
  - Implementar *CoT* no JSON de saída (`"reasoning": "..."` deve ser a primeira chave).
  - Adicionar exemplos *Few-Shot* no system prompt simulando o dialeto brasileiro de oficina ("pode marcha", "manda bala", "ta caro").
- **Trava Backend:** Progressão estrita de funil (a IA só pode avançar, nunca retroceder, a menos que seja para *closed_lost*).
- **UI:** Integrar as justificativas geradas no passo *CoT* diretamente sob a mensagem na UI, com design minimalista.
