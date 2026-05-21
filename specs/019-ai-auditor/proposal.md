# Proposal: Sistema de Auditoria Multi-Agente & RAG Foundation

## Identificador
`019-ai-auditor`

## O Problema
Atualmente, a avaliação do atendimento (Score de Qualidade) é manual, dependendo do Gerente abrir o dossiê e preencher o checklist de 10 passos. Com alto volume de leads, isso é impossível de manter. O usuário precisa de uma IA que automatize essa auditoria, mas teme alucinações, lentidão e uma arquitetura "bagunçada".

## A Solução (Arquitetura "Hive Mind")
Implementaremos um padrão de "Mentes Especializadas" (Swarm/Multi-Agent Router). Cada tipo de mídia (imagem, áudio, texto) e cada etapa de negócio é processada por um "Agente Especialista" invocado por um "Agente Roteador".

### Requisitos Funcionais e Arquitetura
1. **Trigger em Tempo Real**: Sempre que uma nova mensagem for inserida em `chat_messages`, o Supabase Webhook chamará um Edge Function.
2. **O Agente Roteador (Roteador Cognitivo)**:
   - Recebe a mensagem.
   - Avalia rapidamente: É áudio? É imagem? É uma mensagem trivial?
   - Roteia para a ferramenta (`tool/skill`) correta sem sobrecarregar o contexto.
3. **Mentes Especializadas (Skills Integradas)**:
   - `AudioAnalyzer`: Ferramenta que usa Whisper + LLM para extrair intenção e tom de voz (Ex: "Cliente irritado com o preço").
   - `VisionAnalyzer`: Ferramenta que avalia a mídia enviada pelo mecânico (Ex: "O vídeo mostra o desgaste do pneu?").
   - `JudgeAuditor`: A mente principal que cruza os dados com o *Checklist de Qualidade* (Scorecard) e atualiza a pontuação do Lead no banco.
4. **Fundação RAG (Retrieval-Augmented Generation)**:
   - Habilitar extensão `pgvector` no Supabase.
   - Criar uma rotina (Skill) no Deno/Edge Function para gerar embeddings das conversas fechadas e criar a base de conhecimento de como a oficina resolve problemas comuns.

## BDD Scenarios

### Cenário: Roteamento de Mídia Completa (Vídeo/Áudio)
- **Given (Dado):** que a IA Roteadora está monitorando um lead.
- **When (Quando):** o mecânico envia um áudio explicando o orçamento junto com uma foto do motor aberto.
- **Then (Então):** o Roteador invoca o `AudioAnalyzer` para transcrever/extrair contexto do áudio, invoca o `VisionAnalyzer` para validar a foto, e em seguida chama o `JudgeAuditor` que carimba 100% de pontuação no requisito "Enviou vídeo/foto do defeito explicativo", atualizando o Score na tela (sem alucinar).

### Cenário: Prevenção de Alucinação (Contextualização Rígida)
- **Given (Dado):** que o cliente faz uma pergunta complexa fora do script.
- **When (Quando):** a IA Avaliadora lê a resposta do atendente.
- **Then (Então):** ela usa uma ferramenta RAG (consultando o histórico de outras conversas) e verifica se a resposta foi precisa. Caso contrário, gera uma anotação de auditoria ("Atendente não foi claro") e pontua adequadamente, documentando a justificativa.
