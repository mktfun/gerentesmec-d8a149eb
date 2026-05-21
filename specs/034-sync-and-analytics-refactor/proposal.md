# Proposal: Sync & Analytics Real-Time

## Requisitos
1. O painel deve exibir o "Tempo Médio de Resposta (TMR)" e o "Score Global" refletindo o **histórico da semana** (ou filtro selecionado) de forma fiel, usando a base do Chatwoot para evitar tempos zerados (0m).
2. O sistema precisa ter a capacidade de "limpar e puxar de novo" os últimos 7+ dias de conversas do Chatwoot para povoar nossa base de `leads` e `chat_messages` com o passado.
3. A nomenclatura no CRM e Modo TV precisa distinguir:
   - **TMR Global (Relatórios):** Tempo que o gerente leva, em média, para responder.
   - **Espera Atual (Modo TV/CRM):** Tempo que a fila está aguardando **neste exato segundo** (se estiver zerado, ótimo!).

## User Stories
1. Como Diretor, quero olhar o Dashboard e o Modo TV e ver a performance real (TMR) da última semana/hoje, e não um "0m" que não me diz nada sobre a produtividade da equipe, para poder cobrar metas.
2. Como Diretor, quero ter a opção de apertar um botão (ou rodar um comando via IA) para sincronizar minha base inteira de conversas que ocorreram antes de eu instalar esse CRM, para ter um histórico limpo e auditável.

## BDD Scenarios

### Cenário: Vizualização de TMR Global
- **Dado** que a unidade teve 5 conversas na semana, e a média do tempo entre a primeira mensagem do cliente e a primeira do gerente foi de 14 minutos.
- **Quando** o Diretor entra no Dashboard.
- **Então** o painel de Relatórios e Modo TV exibem "TMR: 14m" e não a espera em tempo real da fila atual vazia ("0m").

### Cenário: Limpeza e Sincronização Massiva
- **Dado** que o banco de dados do nosso app Supabase está limpo/inconsistente.
- **Quando** rodamos a ferramenta de Sincronização (`sync-history`).
- **Então** o script varre a API do Chatwoot, cria os Leads e popula a `chat_messages` extraindo corretamente as mídias e aplicando a "variável de ouro" (`message_type`) para o lado correto da conversa.
