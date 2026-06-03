# Tasks: Evidence-Based UI

## 1. Mapeamento de UI no Frontend (Stitch/Lovable)
- [ ] Localizar o componente principal de auditoria (ex: `ManagerAuditInspector` ou similar em `src/components/`).
- [ ] Atualizar o componente para receber a prop `audit_reasons` vinda do `lead` e cruzá-la com o `audit_checklist`.

## 2. Refatoração Visual dos Itens (Checklist)
- [ ] Para cada item do checklist renderizado, verificar se ele é `false` e se existe uma string correspondente no objeto `audit_reasons`.
- [ ] Se existir, renderizar uma div elegante abaixo do título da regra com ícone da IA e o texto da justificativa (Fonte ligeiramente menor, cor vermelha/âmbar para alerta).
- [ ] Verificar se ele é `true` e se existe um ID de mensagem no objeto `audit_checklist_messages`.
- [ ] Se existir, renderizar o botão estilizado "🔍 Ver Evidência".

## 3. Implementação da Ação "Scroll to Evidence"
- [ ] Criar ou expor uma função no contexto ou na prop do componente do chat que aceita um `message_id` para realizar rolagem.
- [ ] Implementar um `id={message_id}` ou `data-message-id={message_id}` nas bolhas de chat (componente de renderização de mensagem).
- [ ] Ao clicar no botão "Ver Evidência", invocar a rolagem e adicionar uma classe de CSS temporária que faz a mensagem "pulsar" (highlight).

## 4. O Painel Raio-X da IA (Laudo Bruto)
- [ ] Criar um botão "Ver Laudo da IA" no cabeçalho do painel de qualidade.
- [ ] Criar um Modal/Drawer no React usando Shadcn UI.
- [ ] Opcional/Se viável: Fazer o fetch do último log da `llm_usage_logs` referente àquele lead ou usar a coluna `ai_insight` que já existe na mensagem ou no `lead_memories`.
- [ ] Exibir o conteúdo do Laudo formatado com a estética de terminal retro-futurista de luxo sugerida pela `ux-ui-architect-2026`.
- [ ] Adicionar botão "Corrigir Avaliação Manualmente" (abre modal para editar o checklist no banco de dados Supabase e recalcular a nota).
