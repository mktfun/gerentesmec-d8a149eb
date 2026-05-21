# Research: Refatoração Senior da Integração Chatwoot (Inbox Mapping)

## Contexto e Problema Atual
1. **Erro 500 no Edge Function**: A tentativa de ler credenciais diretamente do banco na Edge Function resultou em `500 - Credentials not found`. Em arquiteturas distribuídas, depender de replicação assíncrona do banco antes de acionar uma função pode gerar *race conditions*, ou problemas de permissões de *Service Role*.
2. **Abordagem Agressiva vs Rate Limits**: Tentar importar todas as conversas do passado de uma vez via `sync` esbarra em Rate Limits agressivos da API do Chatwoot e da API do Gemini (AI Router).
3. **Mapeamento Frágil (Hardcoded String Match)**: Atualmente, o Webhook cruza a Unidade com o Inbox usando o *nome* do Inbox (`name.toLowerCase()`). Isso é frágil, não-escalável e propenso a erros de digitação por parte dos administradores.

## Arquitetura Senior (Solução)

Para garantir estabilidade, segurança e escalabilidade corporativa:

1. **Inversão de Controle nas Credenciais**: O Frontend (que já possui a URL e o Token no Contexto React) enviará essas credenciais de forma segura (payload POST) para a Edge Function. Isso zera a necessidade da Edge Function fazer chamadas extras no banco, acelerando a resposta e acabando com o Erro 500.
2. **Mapeamento Explícito de Canais (Inboxes)**: Em vez de adivinhar unidades por nome, faremos o "Fetch" apenas da estrutura de caixas de entrada (`Inboxes`). Na UI de `Config.tsx`, o usuário verá a lista de canais do Chatwoot e terá um *Dropdown* para vincular manualmente cada Canal à uma `Unit` do sistema.
3. **Tipagem Forte no Banco**: Adicionaremos a coluna `chatwoot_inbox_id` (integer) na tabela `units`. O Webhook passará a procurar a unidade pelo ID numérico oficial do Chatwoot (100% de precisão).
4. **Desacoplamento do Sync de Conversas**: Deixaremos o sistema de forma "Lazy". Apenas conversas *ativas* (que chegam no webhook) serão populadas. Não faremos *Bulk Sync* agressivo, protegendo a cota do Gemini e mantendo o painel performático.
