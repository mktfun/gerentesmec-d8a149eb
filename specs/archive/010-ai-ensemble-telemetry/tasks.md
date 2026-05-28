# Tasks: 010-ai-ensemble-telemetry

## 1. Ajuste da Edge Function (`ai-autonomous-evaluator/index.ts`)
- [x] Refatorar a construção do nome do modelo na hora do log. Se `aiSettings.model` == "Gemini Free-Tier Ensemble (Auto-Routing)", utilizar o nome simulado (ex: "Gemini 3.5 Flash") para o log da telemetria, em vez do modelo cru da API que gerou o fallback.
- [x] Garantir que, ao registrar o SUCESSO ou o ERRO no Supabase (`await supabaseClient.from('llm_usage_logs').insert`), a variável `prompt` seja enviada no campo `input_text`.
- [x] Garantir que o campo `output_text` receba a resposta da IA (seja o erro completo ou a string de saída/LLM Response).

## 2. Ajuste do Frontend (`AdvancedAiPanel.tsx`)
- [x] Localizar o mapeamento do Histórico de Telemetria (onde aparece "SUCESSO" e "Ver Erro").
- [x] Adicionar um botão "Ver Detalhes" (ou transformar "Ver Erro" em "Detalhes" genérico) para que funcione em status "success" também.
- [x] Exibir no modal os campos `input_text` e `output_text`.

## 3. Deploy e Testes
- [x] Realizar o deploy da Edge Function (`supabase functions deploy ai-autonomous-evaluator`).
- [ ] Solicitar ao usuário a validação na UI do frontend testando um evento "Diagnóstico Inteligente".
