# Tasks: Correção de Alinhamento e Avatares no Histórico de Chat

- [x] 1. **Limpar a Tabela de Mensagens Legadas (Backfill Script)**
  - Criar um script Node.js / Deno para iterar sobre todas as mensagens no Supabase com `sender_type = 'bot'`.
  - Como o Chatwoot já tem o histórico, deletar as mensagens legadas defeituosas do banco e rodar a rotina de Sync (ou fazer o update buscando do Chatwoot via API).
  - Como não temos a API do Chatwoot conectada ao Sync para baixar as mensagens velhas ainda, a alternativa é simplesmente DELETAR a tabela `chat_messages` local e refazer o push com um botão de "Sincronizar Mensagens" que chame a Edge Function de Sync Atualizada.
  - Como o usuário precisa testar agora: Atualizar temporariamente no BD todas as mensagens que eram para ser de gerente com um script SQL: `UPDATE chat_messages SET sender_type = 'user' WHERE sender_type = 'bot' AND content LIKE 'Olá MARIO%'`.

- [x] 2. **Refinar a UI do ChatHistoryView**
  - Checar a lógica da variável `isUser = msg.sender_type === 'user'`.
  - Se for 'user' (gerente), garantir que o container da linha tenha `justify-end` e NÃO possua avatar.
  - Se for 'contact' (cliente), usar a primeira letra do cliente no avatar: `<span className="text-[10px] font-black text-emerald-400">{lead.customer_name.charAt(0)}</span>`.
  - Se for 'bot' (automação), usar `<Wrench />`.

- [ ] 3. **Validação Final**
  - Enviar mensagem como gerente no Chatwoot e ver se aparece à direita.
  - Enviar mensagem como cliente no Chatwoot e ver se aparece à esquerda com a letra inicial do cliente.
