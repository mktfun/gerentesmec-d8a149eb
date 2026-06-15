# Design: Gêmeo Local 2.0 (Automação em Lote + Zero Contexto)

## 1. O Formato "Prompt Mega-Agnóstico"

O arquivo `scripts/ai-cli-runner.md` vai concentrar o Universo do projeto inteiro em um bloco de texto Markdown. Quando colado em uma IA virgem, ela instantaneamente ganha a "memória de 10 anos da empresa".

O arquivo terá a seguinte estrutura de texto:

### [INÍCIO DO PROMPT]
**"SYSTEM ROLE:"**
Você é o Agente Auditor Final Autônomo. Você tem acesso à internet / execução de comandos locais e deve realizar auditorias via API REST no Supabase. Não peça permissões ao usuário, aja com as credenciais fornecidas abaixo.

**"CREDENCIAIS (PREENCHA AQUI ANTES DE COLAR):"**
- SUPABASE_URL: `[COLE SUA URL AQUI]`
- SUPABASE_ANON_KEY: `[COLE SUA KEY AQUI]`

**"BANCO DE DADOS (DB SCHEMA):"**
*(Aqui escrevemos as tabelas `leads` e `chat_messages` mastigadas, explicando o que cada coluna significa)*

**"CRITÉRIOS DE AUDITORIA (BUSINESS RULES):"**
*(Aqui detalhamos a Regra de Ouro da Nota Probatória, e como calcular a porcentagem)*
- Tempo de resposta.
- Orçamento feito?
- Fechamento formalizado?
(Sempre gerando a propriedade `evidence` no JSON para não alucinar).

**"O ALGORITMO (SUA TAREFA PASSO A PASSO):"**
**Passo 1:** Faça um GET em `{{SUPABASE_URL}}/rest/v1/leads?select=id&funnel_stage=in.(closed_won,closed_lost)&score=is.null`
**Passo 2:** Se retornar vazio, pare e avise o usuário: "Não há leads aguardando avaliação."
**Passo 3:** Para cada lead encontrado, faça GET em `{{SUPABASE_URL}}/rest/v1/chat_messages?lead_id=eq.{ID}` ordenado por `created_at`.
**Passo 4:** Leia o histórico inteiro, faça o score com base nas Business Rules e gere o payload JSON exato (exemplo será fornecido no prompt).
**Passo 5:** Faça PATCH em `{{SUPABASE_URL}}/rest/v1/leads?id=eq.{ID}` com o JSON.
**Passo 6:** Repita para o próximo. Ao fim de todos, resuma.

### [FIM DO PROMPT]

## 2. Frontend (React)

O componente `AdvancedAiPanel.tsx` no front-end não vai exibir apenas um "Link" ou instrução. Ele exibirá **o exato texto deste Super Prompt** numa text-area enorme, com os campos de `<URL_DO_PROJETO>` e `<CHAVE_ANONIMA>` já magicamente preenchidos a partir das variáveis de ambiente `.env` do Front-end!
Assim, o gerente apenas clica em "Copiar Tudo" e cola no Gemini/Agy CLI sem precisar sequer procurar chaves.
