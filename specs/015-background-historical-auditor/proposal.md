# Proposal: Background Historical Auditor

## Introdução
Para evitar rate-limits na nuvem e o esgotamento dos recursos locais com modelos de IA proxy (ex: Ollama rodando LLMs localmente), precisamos processar a "dívida técnica" de auditoria (mensagens não processadas de conversas antigas) de forma suave e contínua em 2º plano.

## Requisitos (Business & Tech)
1. **Background Job Silencioso:** A aplicação deve puxar 1 mensagem antiga não auditada a cada X segundos de forma assíncrona.
2. **Controle de Ritmo (Throttle):** Não disparar 50 requisições simultâneas para o Evaluator. O sistema deve aguardar o fim de uma avaliação, aguardar Y segundos de cooldown, e então ir para a próxima.
3. **Pausa Automática:** Se a Edge Function retornar erro (ex: Proxy Local offline, JSON Invalido persistente), o sistema deve pausar o worker de background e tentar novamente só daqui a N minutos para não sobrecarregar com loops de erro.
4. **Visibilidade (Heartbeat/UI):** O usuário deve ver o status desse worker no Painel "Acesso de Engenharia", sabendo que a fila está "Sendo esvaziada em 2º plano (1 mensagem a cada 10s)".

## BDD Scenarios

### Cenário: Recuperação Automática de Dívida de Auditoria
- **Given (Dado):** O banco de dados possui 500 mensagens de ontem com `ai_audited = false` e `sender_type = 'user'`
- **When (Quando):** A aplicação React principal for aberta ou mantida aberta
- **Then (Então):** Um Background Hook invisível inicia uma rotina que seleciona 1 mensagem, processa-a, espera 15 segundos e continua para a próxima, sem travar o PC do usuário.

### Cenário: Fallback em caso de Queda do Proxy Local
- **Given (Dado):** O Background Worker está processando o histórico
- **When (Quando):** O Cloudflare Tunnel ou Proxy Local caem, fazendo a Edge Function retornar status 500.
- **Then (Então):** O Background Worker entra em estado "Pausado (Erro de Rede)" e só tenta novamente após 2 minutos.

### Cenário: Visibilidade no Painel de Controle
- **Given (Dado):** O gerente abre o `AdvancedAiPanel`
- **When (Quando):** Acessa a aba de "Fila de Avaliação IA"
- **Then (Então):** A interface mostra um botão Switch "Auto-Processar Fila em 2º Plano" ativado por padrão e exibe a velocidade atual (Ex: "1 req / 15s").
