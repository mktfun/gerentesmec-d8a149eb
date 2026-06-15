# Proposal: Arquitetura de IA Hierárquica e "Zero-Hallucination" (ID: 043-hierarchical-ai)

## 📌 Contexto e Problema Atual
Atualmente, o `ai-autonomous-evaluator` roda a cada 5 minutos e analisa toda a conversa para preencher o checklist de 12 pontos (ex: "Mandou orçamento?", "Respondeu no SLA?").
**O Problema:** A IA sofre de "miopia temporal". Como a conversa ainda está acontecendo, ela se confunde com quem falou o quê, comete falsos positivos (marca que o cliente deu "sim" quando não deu), e encerra o funil prematuramente. Além disso, rodar o checklist completo a cada 5 minutos queima uma quantidade gigantesca de tokens na API.

## 🎯 A Solução: Padrão Claude Code (Coordenador & Filhas)
Inspirado na arquitetura do Claude Code, vamos abandonar a IA monolítica que faz tudo o tempo todo, e dividi-la em uma **Hierarquia de Agentes (Swarm)**, onde a avaliação rigorosa só acontece quando a prova do crime está completa.

### 1. O Agente Rastreador (O "Estagiário" / Tracker)
- **Quando roda:** A cada 5 minutos (via Cron atual).
- **Custo/Modelo:** Extremamente barato (ex: Claude 3 Haiku ou GPT-4o-mini).
- **O que ele faz:** Ele *não* faz o checklist! Ele apenas lê as últimas mensagens para:
  1. Identificar a intenção e atualizar a Etapa do Funil.
  2. **Regra de Ouro:** O funil só anda para frente (apenas `lead` -> `negociacao` -> `fechado`, nunca volta para `lead`).
  3. Gerar um micro-resumo do que aconteceu e salvar num "Scratchpad" interno do Lead.

### 2. O Agente Auditor (O "Juiz" / Auditor)
- **Quando roda:** **APENAS** quando o Agente Rastreador (ou o Gerente) move o funil para `closed_won` (Ganho) ou `closed_lost` (Perdido).
- **Custo/Modelo:** Alto, mas roda apenas 1x. Em vez de modelo fixo, usaremos o roteamento dinâmico **"Otimização Máxima"**, buscando sempre a melhor e mais atual versão da API configurada (Anthropic, Google, OpenAI, etc).
- **O que ele faz:** Como a conversa já acabou, ele tem a visão de "Ponta a Ponta".
  1. Carrega todas as transcrições de áudio/vídeo e descrições de imagens.
  2. Carrega a conversa inteira.
  3. Julga o checklist de 12 pontos de forma implacável e exata, porque o contexto está 100% fechado. Sem adivinhações.
  4. **Nota de Evidência:** Para cada item marcado no checklist, a IA preencherá obrigatoriamente um campo de "justificativa", colando o trecho exato da mensagem, áudio-descrição ou transcrição de vídeo que serviu de gatilho para ela marcar o item.

### 3. A Válvula de Escape ("Sem Contexto")
- Se a inteligência perceber que o atendimento teve "muitos furos", áudios ininteligíveis, ou simplesmente perdeu o contexto a ponto de não conseguir julgar o desfecho, ela **NÃO vai chutar**.
- Ela vai mover o lead para uma nova coluna no Kanban chamada **"Sem Contexto"**.
- Ali, você ou o gerente preenchem as lacunas manualmente e devolvem para Ganho/Perdido para a IA finalizar a auditoria corretamente.

### 4. O "Gêmeo Local" (CLI Agent Runner)
- Para garantir redundância e controle total, criaremos um Super Prompt documentado (um manual de instruções completo com credenciais simuladas, caminhos de banco de dados e regras de negócio).
- Você poderá colar esse prompt no seu terminal usando o **Agy / Gemini CLI**, e o seu próprio terminal se transformará no "Agente Auditor", rodando 100% localmente e fazendo o trabalho do Supabase Edge Functions de forma transparente.

## 💰 Vantagens
1. **Falha Quase 0:** A IA só emite a nota fiscal (score) quando o serviço acaba. Ela sabe exatamente quem mandou o orçamento e se o cliente aceitou.
2. **Queda drástica de Custo de API:** Em vez de rodar o prompt gigante do checklist 20 vezes durante 2 dias de negociação, ele vai rodar apenas 1 vez no final.
3. **UX Perfeita:** O gerente pode acompanhar o funil andando sozinho pelo Kanban (pelo Tracker) e só recebe a auditoria completa quando o lead esfria ou compra.

> [!IMPORTANT]
> **Open Question:** Você concorda em desvincular o checklist em tempo real e deixá-lo exclusivo para o momento do Fechamento (Won/Lost)? Durante o andamento da negociação, a IA cuidará apenas do Funil e das Transcrições.
