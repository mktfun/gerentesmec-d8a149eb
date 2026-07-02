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

## Padrões Adotados
- **React**: Uso de `useMemo` para barrar a regeneração aleatória de arrays (ex: fake waveform bars do áudio) baseando o "seed" nos caracteres da URL para manter a onda estática.
- **CSS / Tailwind**: Uso de `bg-[#38383A]` em contraste com fundo dark, animações em `transition-all duration-300 ease-in-out` e manipulação de `w-0 opacity-0` para esconder elementos elegantemente.

## Integração Notion (Workaround)
- **Bloqueios de Exportação / Limitações de FDW**: Devido a instabilidades ou falhas no FDW (tabela `notion_agenda` que sincroniza diretamente via API) que correm o risco de limpar a visão do Dashboard, implementamos uma solução local com **Playwright**.
- **Data Scraping Automático (Network Intercept)**: Criamos um robô (`central-test-hub/src/notion-sync`) que faz login no Notion via Cookie (sem expirar) e intercepta os pacotes JSON brutos `queryCollection` diretamente do tráfego de rede, ignorando limitações de UI (como o botão de Exportação cinza).
- **Projetos no Supabase**: Lembre-se que há dois projetos em jogo. O projeto PRINCIPAL em uso para a tabela `notion_agenda` é o `ijomsruroyeaapurnbqu`, então sempre certifique-se que o `.env` ou o script está apontando para o `project_ref` e DB Password corretos. O dashboard de Produção/Local costuma consultar o Supabase Oficial. Nunca confunda com `qtjitszradxsmnilnqtj`.
