# Design & Arquitetura

## 1. Atualização do Checklist (UI)
Vamos adicionar novos IDs ao `auditStepsConfig`:
- O `auditStepsConfig` atual será extraído de componentes de UI e passará a residir de forma exportada em `src/utils/scoreUtils.ts`.
- **Novos Itens na Etapa 2 (Orçamento):**
  - `2d`: "Enviou link do checklist prescrito com defeitos e fotos?"
  - `2e`: "Houve aprovação/sim do cliente entre o envio do orçamento e do checklist?"

## 2. Scraping de URLs em Deno (Supabase Edge Function)
A grande sacada arquitetural aqui é aproveitar que o Supabase Edge Functions roda em um ambiente Node/Deno onde `fetch` é nativo.

O pipeline dentro do arquivo `ai-autonomous-evaluator/index.ts` será:
1. Receber todas as `messages`.
2. Usar uma Regex para encontrar URLs contidas em `message.content` (ex: `https://...`).
3. Disparar chamadas `fetch(url)` assíncronas paralelas (usando `Promise.allSettled` para não quebrar em erros de CORS/URLs inválidas).
4. Para cada URL resolvida, converter o HTML para texto legível. Como estamos no Deno, não temos `DOMParser` completo sem lib extra, então faremos uma limpeza de Regex para remover `<style>`, `<script>`, `<head>` e extrair apenas o textContent bruto, que para a IA já é suficiente.
5. Concatenar o conteúdo extraído no prompt final que vai para o Gemini.

Exemplo de injeção no Prompt:
```text
Abaixo está o conteúdo extraído automaticamente dos links que o gerente enviou no chat. 
Use isso para avaliar SE os orçamentos, checklists e diagnósticos têm as informações completas:
[URL 1 - https://...]: "Descrição: Troca de óleo..."
```

## 3. Comandos de IA (Engenharia de Prompt)
Para forçar a IA a considerar a qualidade, as regras de pontuação na seção JSON devem ser atualizadas.
A IA deve pontuar apenas se o link existe **E** se o conteúdo que vazou desse link é justificável e detalhado. Se a IA notar que a explicação está pobre no link, ela deverá inserir a explicação do motivo na chave `"message_insight"` justificando "Orçamento vazio de explicações técnicas."
