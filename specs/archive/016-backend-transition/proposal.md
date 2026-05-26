# Software Design Document (SDD) & Proposal (016)

## 1. Executive Summary
Esta proposta define a arquitetura para a transição do MVP do **GerentesMec** (baseado em mocks locais) para uma infraestrutura de Produção robusta, autônoma e serverless, utilizando **Supabase** (PostgreSQL + Edge Functions). A transição inclui inteligência dinâmica de provedores de IA e a geração de sumários executivos de encerramento de vendas para análise de Big Data.

## 2. Requisitos de Sistema e Arquitetura

### 2.1 Backend / Database (Supabase)
Todo o estado global sairá do `mockData.ts` para um banco de dados relacional.
- **Tabelas Principais:** `units`, `managers`, `leads`, `ai_settings`.
- **Realtime:** Habilitaremos replicação no Supabase para as tabelas `leads` e `ai_settings`, garantindo que o TV Mode e o Dashboard do CEO reajam instantaneamente a atualizações na surdina feitas pela Inteligência Artificial.

### 2.2 Motor de Diagnóstico de IA (Smart Routing)
- **Desafio:** Garantir que o usuário saiba se o modelo que ele colou suporta as capacidades ativadas (Visão, Vídeo, Transcrição).
- **Solução:** Uma Edge Function `test_provider`. Quando o usuário insere a API Key no Front-end, ele faz um POST. A função dispara requests leves para o provedor validando modalidades.
- **Fallbacks & Recomendações:** Se um modelo (ex: `gemini-1.5-flash`) falhar no teste de vídeo direto, o sistema retornará um JSON: `{"video": false, "recommendation": "Para análise de vídeo do mecânico, faça upgrade para gemini-1.5-pro via OpenRouter ou gpt-4o."}`.

### 2.3 Sumarização de Encerramento (Big Data)
- **Desafio:** Quando o lead vira "Encerrado", os detalhes ficam perdidos na timeline do Chatwoot.
- **Solução:** O evento de mudança de card para a coluna `closed_won` (ou `closed_lost`) via React dispara uma atualização no banco. Um **Supabase Webhook/Trigger** detecta essa mudança de estado e invoca a Edge Function `generate_summary`.
- **Ação:** A IA compila a dor do cliente, a solução oferecida, o preço e a atitude do mecânico num parágrafo conciso, salvando no banco.

---

## 3. User Stories

1. **Como Administrador**, quero cadastrar a chave do `gemini-1.5-flash`, e ver o sistema me alertar na hora que esse modelo não suporta leitura nativa de vídeo pesado, recebendo uma recomendação visual elegante de qual modelo superior usar, sem precisar ler documentação.
2. **Como CEO**, quando um gerente arrasta um lead para a coluna de "Concluído", quero que a IA automaticamente leia o histórico e gere um sumário do atendimento, para que eu possa gerar relatórios de Business Intelligence no futuro.
3. **Como Desenvolvedor**, preciso de uma fundação PostgreSQL limpa, com Row Level Security (RLS) habilitado, para garantir que os dados de auditoria não sejam acessíveis publicamente.

---

## 4. BDD Scenarios

### Cenário: Diagnóstico de IA Inteligente
- **Given:** O usuário está na tela `/config`.
- **When:** Ele define o provider como "OpenRouter", digita `meta-llama/llama-3-8b` e ativa a flag "Análise de Vídeo (Checklist)".
- **And:** Ele clica em "Salvar e Testar".
- **Then:** O front-end chama a Edge Function, que identifica a limitação do Llama-3 para vídeo. O sistema salva a configuração de texto, desativa a flag de vídeo e mostra na tela: "⚠️ Llama-3 não suporta vídeo. Sugerimos usar Claude 3.5 Sonnet ou GPT-4o para habilitar esse recurso."

### Cenário: Sumarização de Lead Concluído
- **Given:** O gerente está na tela de CRM e o lead "Carlos - Civic" está em Negociação.
- **When:** O gerente arrasta o card do Carlos para a coluna "Encerrado" (closed_won).
- **Then:** O front-end faz o update no Supabase. O banco dispara uma Edge Function. O card do Carlos recebe, após 3 segundos, um ícone de "Relatório de Fechamento Gerado", contendo o resumo da venda disponível ao clicar nele.
