# Design e Arquitetura

## 1. Golden RAG (Carijós)
Para plugar um exemplo positivo real no `ai-autonomous-evaluator`, atualizaremos o `system_prompt` no banco de dados (ou hardcoded no fallback do Edge Function) para incluir um bloco explícito de `FEW-SHOT PROMPTING`.
**Exemplo Injetado:**
```text
[EXEMPLO DE ATENDIMENTO 100% - LOJA CARIJÓS]
Gerente: "Bom dia Sr. João! Segue o link do nosso checklist detalhado com as fotos do vazamento e o orçamento final: [LINK]. Aproveito para recomendar a troca preventiva da correia, enviei um vídeo rápido de 40 seg mostrando o desgaste acima."
Cliente: "Assustador! Pode aprovar tudo."
Gerente: "Maravilha. Serviço finalizado. Muito obrigado pela confiança! Pode nos deixar uma avaliação no Google? [LINK]"
[FIM DO EXEMPLO]
```

## 2. Visão Restrita de Loja
No Frontend, usaremos o contexto de Autenticação (`useAuth` ou o próprio `AppDataContext`) para verificar se o usuário é um administrador ou um gerente de unidade.
- **Header:** Ocultar o menu "Ajustes de IA" para gerentes de unidade.
- **Relatórios:** Forçar o `selectedUnit` para a unidade logada e desabilitar o `<select>`.
- **KPIs:** Exibir apenas as estatísticas locais.

## 3. Avaliação Multimodal de Áudio/Vídeo
O Supabase Edge Function já suporta o envio da mídia em Base64 para as APIs compatíveis. O Gemini 1.5 Flash suporta análise nativa de áudios e vídeos enviados desta forma.
**Design de Análise Profunda:**
A instrução do *System Prompt* será alterada para:
"Se a mensagem contiver um anexo de mídia (vídeo ou áudio), ESCUTE e ASSISTA ao anexo. Você deve validar se o mecânico aprofundou a explicação. Um vídeo ou áudio curto (ex: < 2 minutos) ou que seja superficial e não explique exatamente o problema e o motivo do cliente ter que pagar, NÃO deve render pontos nos itens 2c e 3c. Só pontue evidências e explicações (2b, 2c, 3b, 3c) se a transcrição técnica for rica em detalhes e justificar perfeitamente o serviço."
