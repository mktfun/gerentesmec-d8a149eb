# Checklist de Implementação (Feature 006)

- `[ ]` 1. Atualizar Interface `ChatMessage`
  - `[ ]` No `ManagerAuditInspector.tsx`, adicionar suporte para `media_url?: string` e `media_type?: string` na interface.
  - `[ ]` Garantir que a busca (select do Supabase) traga essas colunas (já traz `select('*')`).
- `[ ]` 2. Lógica Baseada em ID Real
  - `[ ]` Remover a heurística de `STEP_WINDOWS` e a distribuição randômica de qualidade (array vazio de timeline injection falso).
  - `[ ]` Carregar a propriedade `lead.audit_checklist_messages` via typecasting.
  - `[ ]` Dentro do `buildTimeline`, procurar se a mensagem atual bate com algum dos IDs de mensagens contidos no mapa. Caso bata, salvar o respectivo evento associado estritamente àquela mensagem (prop `quality_hits`).
- `[ ]` 3. Design: AI Note Minimalista
  - `[ ]` Na renderização de mensagens, se houver um hit de qualidade (`quality_hits`), renderizar um box discreto grudadinho embaixo do balão, mostrando a aprovação e explicação da IA.
  - `[ ]` Remover eventos soltos da timeline.
- `[ ]` 4. Tratamento de Anexos
  - `[ ]` Fazer parse e limpar strings que digam `[ANEXO ENVIADO: ...]`.
  - `[ ]` Se for áudio (`media_type?.startsWith('audio')`), injetar tag `<audio src={media_url} controls className="w-full mt-2 rounded-lg" />`.
  - `[ ]` Se for imagem (`media_type?.startsWith('image')`), injetar tag `<img src={media_url} ... />`.
- `[ ]` 5. Fluidificação Framer Motion
  - `[ ]` Aplicar `layout` nas `motion.div` do chat, utilizando `transition={{ type: "spring", bounce: 0.2 }}` para animar subidas de altura com naturalidade.
- `[ ]` 6. Garantia de Build
  - `[ ]` `npm run build` após as modificações.
