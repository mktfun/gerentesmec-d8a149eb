# Memória do Projeto

## Preferências de UI / UX
- **Audio Player no Chat**: O usuário tem aversão a "caixas/blocos" de áudio. Prefere estilo "inline", simples, profissional e idêntico à dinâmica do WhatsApp. O botão de velocidade de reprodução (1x, 1.5x, 2x) deve ficar oculto e aparecer via animação (slide + fade in) somente quando o áudio é tocado.
- **Divisores de Data no Chat**: Como o WhatsApp, deseja uma "pílula" divisora entre dias (`[HOJE]`, `[ONTEM]`, `[DIA DA SEMANA]`, `[DIA/MES]`).
- **Botões de Atalho**: Inserir links sutis e elegantes que abram plataformas externas (como o Kanban do ChatBee).
- **Timeline de Atividades**: A visão geral deve ignorar quem enviou a última mensagem e listar sempre a visão da Conversa com Ícone do Cliente, Nome do Cliente, Nome do Responsável e Status.

## Workarounds Backend e Banco de Dados
- **Bug do Webhook do ChatBee**: As automações/respostas da IA (Bot) chegam no payload da webhook como `sender_type: "cliente"`. 
  - **Ação Paliativa**: Adicionada uma heurística rigorosa no `MessageBubble.tsx` que analisa o `msg.content.toLowerCase()` para identificar frases-chave do bot (ex: "como posso te ajudar", "o diagnóstico adequado", emojis específicos). Se detectar padrão de Bot, forçamos o React a renderizar a mensagem do lado Direito/Verde, mesmo o banco dizendo que é do Cliente.
- **Duplicatas de Mensagem**: O webhook dispara eventos repetidos no mesmo milissegundo e o Supabase está inserindo ambos (presumivelmente por falta de unique constraint no `message_id`). 
  - **Ação Paliativa**: No `ChatModal.tsx`, há um loop que ignora mensagens subsequentes se elas possuírem o exato mesmo texto, mesmo tipo de remetente e a diferença de tempo for inferior a 10 segundos.
- **Fantasmas de Fechamento em Massa (Protocolo Expirado)**: As rotinas automáticas do ChatBee fecham chats ociosos e disparam o webhook `ATTENDANCE_CLOSED`. O nosso Edge Function faz um `upsert` e, para tickets não mapeados previamente, insere uma linha nova (`created_at` = Hoje). Isso inflaciona violentamente os "Leads Hoje" e "Perdidos Hoje" da dashboard.
  - **Ação Paliativa (Filtro Anti-Fantasmas)**: Em `useDashboardData.ts`, todo ticket com status de perda/expiração que foi "criado hoje" deve ter a regra condicional: só é contado hoje SE possuir alguma mensagem registrada HOJE na tabela `chatbee_messages`. Senão, ele é ignorado dos KPIs diários.

## Padrões Adotados
- **React**: Uso de `useMemo` para barrar a regeneração aleatória de arrays (ex: fake waveform bars do áudio) baseando o "seed" nos caracteres da URL para manter a onda estática.
- **CSS / Tailwind**: Uso de `bg-[#38383A]` em contraste com fundo dark, animações em `transition-all duration-300 ease-in-out` e manipulação de `w-0 opacity-0` para esconder elementos elegantemente.

## Integração Notion (Workaround)
- **Bloqueios de Exportação / Limitações de FDW**: Devido a instabilidades ou falhas no FDW (tabela `notion_agenda` que sincroniza diretamente via API) que correm o risco de limpar a visão do Dashboard, implementamos uma solução local com **Playwright**.
- **Fantasmas do FDW no Supabase**: A base oficial `notion_agenda` possui milhares de registros malformados herdados do FDW antigo (campos `titulo` e `horario` vazios). Para que o Dashboard não exiba esses registros antigos (ex: 18/06 "Sem nome"), o frontend (`useDashboardData.ts`) **DEVE OBRIGATORIAMENTE** aplicar o filtro `if (!item.titulo || !item.horario) return false;`. Nunca tente deletá-los diretamente no Supabase para evitar perda de dados legados.
- **Data Scraping Automático (Network Intercept)**: Criamos um robô (`central-test-hub/src/notion-sync`) que faz login no Notion via Cookie (sem expirar) e intercepta os pacotes JSON brutos `queryCollection` diretamente do tráfego de rede.
  - **Atenção ao Lazy Loading**: O Notion não carrega a tabela inteira. O robô foi configurado para fazer scroll (`mouse.wheel`) várias vezes e agrupar múltiplos arquivos `queryCollection*.json` em um só (`merged_collection.json`) antes de upar para o banco, senão dados do final da lista ("Agendamentos de Amanhã") serão esquecidos.
- **Projetos no Supabase**: Lembre-se que há dois projetos em jogo. O projeto PRINCIPAL em uso para a tabela `notion_agenda` é o `ijomsruroyeaapurnbqu`, então sempre certifique-se que o `.env` ou o script está apontando para o `project_ref` e DB Password corretos. O dashboard de Produção/Local costuma consultar o Supabase Oficial. Nunca confunda com `qtjitszradxsmnilnqtj`.

## Histórico de Atualizações de Infraestrutura
- **Mudança de Conta no Chatwoot (Julho/2026)**: A conta ativa associada ao token de acesso do Chatwoot mudou do ID `5` para o ID `6` (`bot mecanica`). O campo `chatwoot_account_id` foi atualizado na tabela `integration_settings` no Supabase do CRM (`qtjitszradxsmnilnqtj`). Todos os scripts locais e de pipeline de auditoria offline foram atualizados para usar `/accounts/6`, evitando erros `HTTP 401 Unauthorized`.
- **Migração Supabase Cloud -> Self-Hosted (VPS)**: O banco de dados Cloud (`qtjitszradxsmnilnqtj` e `ijomsruroyeaapurnbqu`) foi extraído via pooler IPv4 (`pg_dump` do PostgreSQL 17) para evitar erros de versão/rede e injetado em uma VPS Docker Compose local (`100.114.251.99:8000`).
  - **Headless CLI Enforcement**: Todo o setup (clonagem do repositório oficial da Supabase, geração criptográfica de `JWT_SECRET`, deploy das Edge Functions e esmagamento de `.env` local para se conectar via IP) foi programado via Scripts Node e executado através de conexões Node-SSH invisíveis para evitar que as credenciais travem o PowerShell no Windows.
  - **Lovable e Frontend Sync**: O projeto Frontend usa as chaves `ANON_KEY` e URLs extraídas por automação para apontar para o pooler e API hospedados na VPS, mantendo total simetria com a plataforma de design em nuvem.
