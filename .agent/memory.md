# Agent Memory

## Preferências de Arquitetura
- Frontend: Vite + React + Tailwind + shadcn/ui.
- Interatividade UI: Uso de `framer-motion` para micro-interações (hover/tap em cards e modais). Preferência por transições suaves (`transition-all duration-200/300`).
- Estado UI: Persistir preferências locais (como sidebar colapsada) no `localStorage`.
- Backend/DB: Supabase. Uso de RPCs para operações pesadas no banco (ex: Limpeza de mídia).
- Limites do BD: Atenção ao armazenamento de mídia (`media_url`) direto no Supabase free tier. Sempre criar botões/cron de limpeza (limite de 7 dias) se houver anexos/base64 pesando.
- Configuração Vite: Variáveis de ambiente prefixadas com `VITE_`.

## Preferências de Arquitetura AI (Agentes)
- **Hierarchical Swarm / Tracker vs Auditor:** Não use modelos grandes e caros a cada mensagem. Use um modelo barato e rápido (Rastreador) rodando em background (cron) com um `ai_scratchpad` (memória viva) só para ditar se o funil avança. Use um modelo Top Tier (Auditor) *apenas* nos gatilhos de fechamento (Ganho/Perdido) com acesso ao contexto de ponta a ponta.
- **Regra da Nota Probatória (Zero Hallucination):** IA avaliadora não pode apenas dar score ou "checked: true". Todo JSON de auditoria DEVE exigir o campo `evidence` contendo o trecho exato (texto/descrição) para justificar a pontuação.
- **Válvula de Escape (Needs Context):** Nunca force a IA a deduzir contexto corrompido ou ininteligível. Crie sempre estados como "Sem Contexto" (`parking_lot`) que exigem que o humano intervenha antes da IA continuar.
- **Roteamento de "Otimização Máxima":** Em vez de hardcodar modelos (ex: GPT-4o), crie abstrações que batem nas APIs mais robustas do momento baseado no provider configurado (ex: Claude 3.7 Sonnet, Gemini 2.0 Pro).
- **Paradigma do Contexto Zero (Gêmeo Local):** Para agentes CLI locais, JAMAIS exija que a IA leia arquivos ou "tente descobrir" a arquitetura do projeto. Forneça "Mega Prompts" maciços que já contêm o schema do banco completo mastigado, as chaves de API injetadas e o passo-a-passo algorítmico.
- **Trabalhadores Autônomos (Batch):** Evite que o humano precise alimentar IDs manualmente. Modele os agentes CLI para baterem no banco com uma "Query Mágica", vasculharem a fila de trabalho pendente (ex: leads sem nota) e iterarem em um laço `while/for` até limparem toda a fila sozinhos.

## Erros Passados
- IA Monolítica pesava no banco e esgotava tokens rápido avaliando 12 pontos a cada mensagem. (Resolvido pela divisão Tracker/Auditor).

## Persona do Usuário
- Exige altíssima qualidade de UI, mas com lógica pragmática e custo de infraestrutura extremamente otimizado (preocupação pesada com tokens e storage). Gosta de arquitetura descentralizada, provando que a IA realmente leu a mensagem (Evidências) e não adivinhou.
- Adora usar CLI local (`Agy`/`Gemini CLI`) usando Mega Prompts locais ("Gêmeo Local") em vez de depender 100% da nuvem, garantindo fallback e testes sem gastar build.
