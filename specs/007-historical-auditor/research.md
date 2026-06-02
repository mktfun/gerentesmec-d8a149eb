# Research: Auditoria Histórica Autônoma (Retroativa)

## 1. Contexto e Problema
A rede de oficinas implementou a auditoria via IA recentemente. Isso gerou um hiato de dados: Leads que já estavam em atendimento no Chatwoot antes do sistema entrar no ar possuem pontuações (`score`), memórias (`lead_memories`) e checklists (`audit_checklist`) incompletos ou em branco. Como a IA atual (`ai-autonomous-evaluator`) funciona de forma reativa (mensagem por mensagem), ela não tem o contexto anterior para avaliar corretamente uma conversa que já está no meio do funil (ex: o mecânico manda um "ok, carro liberado", mas a IA não sabe se o orçamento foi aprovado antes).

## 2. Necessidade do Usuário
- Uma API / Script capaz de varrer os "cards" (leads) antigos e auditar a conversa inteira do zero.
- Capacidade de processar mídias (áudio, imagem e vídeo) de forma autônoma.
- Utilizar as ferramentas do próprio agente (Antigravity CLI / Subagents) para realizar o trabalho pesado, driblando os limites de tempo de execução (timeout) que uma Edge Function tradicional da Supabase teria ao baixar/processar gigabytes de vídeos históricos.

## 3. Análise Técnica e Limitações
- **Edge Functions (Deno):** Possuem limite de execução (wall-clock time) e RAM restrita. Baixar 50 vídeos do Chatwoot e mandar para a IA em uma Edge Function causaria `Function Timeout` na certa.
- **Solução Ideal (Script Local / Subagent):** O próprio Antigravity rodará um script Node.js na máquina local (ou um agente especializado rodará em background). Esse script fará paginação no banco de dados, baixará os históricos, fará o upload das mídias para a API do Gemini via *Google AI File API* (que suporta vídeos pesados nativamente), extrairá a auditoria massiva (One-Shot), e fará o UPDATE no banco.

## 4. Oportunidade de Arquitetura
Como o modelo de fundação (Gemini 1.5 Pro) possui até 2 Milhões de tokens de contexto, não precisamos debugar a conversa mensagem por mensagem no passado. Podemos enviar o `Transcript` completo do Chatwoot + Arquivos Multimídia e pedir para a IA cuspir o estado atual perfeito do Lead (`funnel_stage`, `score`, `audit_reasons`).
