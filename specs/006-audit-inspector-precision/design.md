# Design: Precision Audit & Liquid Media (Feature 006)

## 1. Princípios Visuais da UI
- **Sub-mensagens de Vistoria (AI Nodes)**: Abaixo das mensagens do chat que tiverem hits da IA (checklist passed), adicionaremos um balão menor colado abaixo da mensagem (tipo um reply ou thread do Discord/Slack), com fonte `font-instrument`, tamanho diminuto (`text-xs`), fundo clarinho/pastel (ex: `bg-emerald-500/10`) e contornos suaves, evitando interromper a leitura primária.
- **Liquid Glass nas Mídias**: Imagens anexadas devem possuir bordas internas reflexivas, `rounded-xl`, permitindo clique para visualização se for possível, mas renderizando de forma enxuta com altura máxima para não tomar toda a tela.
- **Áudio Nativo Clean**: Aplicar um layout de player limpo e que se adapte ao Dark/Light mode, não deixando botões cegos.

## 2. Topologia de Componentes

### A. Timeline Engine
- Remover `STEP_WINDOWS`.
- Criar a regra de matching `lead.audit_checklist_messages[checklist_id] === msg.id`.

### B. Balões de Mensagem (Chat Bubble Upgrade)
- `layout` property do framer-motion nos balões de chat para animação elástica (spring).
- Dentro do balão:
  - Se tem texto -> Parágrafo normal.
  - Se tem áudio -> `<audio controls src={msg.media_url} />`.
  - Se tem imagem -> `<img src={msg.media_url} alt="anexo" className="rounded-xl w-full object-cover max-h-48 mt-2 shadow-sm" />`.
  - Limpar strings de lixo geradas pelos hooks (ex: substituição via regex `\[ANEXO ENVIADO:[^\]]+\]`).

### C. Container de Nota da IA
- Colado diretamente abaixo da mensagem (margin-top muito pequena).
- Ícone minúsculo brilhante.
- Background colorido apenas no container, e não na borda. Sem glow excessivo, apenas cores sólidas e brandas, respeitando contraste (WCAG 2.2).
