# Adição de Critérios e Web Scraping para IA

## Contexto e Lacunas Identificadas
O usuário solicitou uma melhoria na forma como a Inteligência Artificial (IA) avalia os atendimentos:
1. **Novos Critérios no Score:** Adicionar 2 novos itens à Etapa 1 (que pode ser unificada com a 2, "Orçamento"):
   - Envio do link do "Checklist do Veículo" contendo a prescrição dos defeitos e fotos.
   - Resposta/Aprovação do cliente (ex: dar um "sim") entre o link do orçamento e o checklist.
2. **Avaliação Qualitativa dos Links:** Atualmente, a IA pode deduzir que o gerente enviou um link apenas por ver uma URL no chat. O usuário quer que a IA **acesse** esses links (Orçamentos, Checklists, HTMLs públicos), leia o conteúdo e avalie se as justificativas e prescrições estão corretas, detalhadas e sem serem "vagas".

## Requisitos
- Adicionar os 2 novos itens no checklist visual da plataforma (CRM e Relatórios).
- Centralizar o objeto `auditStepsConfig` que hoje está duplicado/hardcoded entre `AuditPanel.tsx` e (se importado) `ReadOnlyAuditPanel.tsx`.
- Modificar o Edge Function `ai-autonomous-evaluator` para extrair as URLs presentes no histórico de chat.
- O Edge Function deve fazer um `fetch` assíncrono do conteúdo HTML dessas URLs, limpar as tags (extrair o texto/conteúdo legível) e injetar esse texto no prompt do Gemini.
- A IA do Gemini receberá instruções estritas para não dar a nota máxima caso o conteúdo do link não tenha qualidade (ex: falta de justificativa técnica) e deverá incluir isso no campo `message_insight`.

## BDD Scenarios

### Cenário: Validando qualidade técnica via link
- **Given (Dado):** que a IA está analisando um atendimento concluído.
- **When (Quando):** o gerente enviou a URL `https://exemplo.com/orcamento/123`.
- **Then (Então):** o Edge Function varre a URL, extrai o texto "Troca de óleo sem justificativa" e envia para a IA.
- **And When (E Quando):** a IA avalia o texto do link.
- **Then (Então):** a IA **zera** a pontuação de "Explicou consequências e defeitos", e anota no `ai_insight`: "O link do orçamento não possui descrição técnica detalhada ou justificativa para a troca de óleo."
