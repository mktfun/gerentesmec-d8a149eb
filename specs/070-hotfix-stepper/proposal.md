# Spec 070: Hotfix Crítico do Stepper de Auditoria (Blindagem de Regras)

## 1. Visão Geral (O Bug)
O componente imersivo de Auditoria (`AuditoriaExecution.tsx`) perdeu as validações de barreira entre os cards (permitindo avançar sem foto ou observação) e os sub-títulos de instrução da foto não estavam sendo mapeados corretamente do banco (`instruction` ou `photo_instruction` não sendo passados como prop). O contexto de categoria estava fraco.

## 2. Guardrails (Constituição)
- "Ergonomia Tátil": Botões não podem permitir falso avanço. Se não pode avançar, o botão deve estar VISIVELMENTE desabilitado (`opacity-30 disabled:pointer-events-none`).
- "Notas Não Conformes": A observação em itens `nok` é estritamente obrigatória, e a UI deve refletir isso em vermelho.
- "Contexto Físico": O app precisa avisar o usuário que ele precisa se deslocar fisicamente de um setor (ex: Fachada) para outro (ex: Recepção).

## 3. Especificação de Componentes (Mutações)

### A. `AuditoriaExecution.tsx` (Orquestrador)
- Adicionar Helper Local `canAdvance()` que avalia o item atual (`currentItem.data`).
- Lógica de Bloqueio do Botão:
  - Se `status === null` -> Desabilitado.
  - Se `status === 'na'` -> Requer `notes.trim().length > 0`.
  - Se `status === 'ok'` -> Requer `photos.length >= minPhotos`.
  - Se `status === 'nok'` -> Requer `photos.length >= minPhotos` AND `notes.trim().length > 0`.
- Lógica de Transição (Interstício Físico):
  - No `handleNext`, olhar o `flatItems[currentGlobalIndex + 1]`.
  - Se `nextItem.categoryIdx !== currentItem.categoryIdx`, acionar a tela de loading `isTransitioning` com a mensagem "INICIANDO: [Nome da Nova Categoria]" por 2000ms antes de atualizar o `currentGlobalIndex`.

### B. `AuditoriaItemCard.tsx` (UI do Card)
- Header da Categoria: Modificar a badge do topo esquerdo para usar o pino de mapa (📍) e ampliar o peso visual.
- Subtítulo da Foto (`instruction`): Renderizar abaixo do título do item. (Hoje já existe um bloco para isso, mas o orquestrador não passa a prop correta).
- Block de Observações (textarea): Alterar condicional visual para: "Obrigatório quando status é 'N/A' OU 'Não Conforme'". Se o status for `nok`, aplicar styling vermelho no bloco conforme guideline.

## 4. Riscos Mapeados (Bayesian Logic)
- **Problema de Types:** O payload salvo localmente usa a prop `instruction` ou `photo_instruction`? Vou injetar `currentItem.data.instruction || currentItem.data.photo_instruction` na prop `instruction` para prever ambas as versões do schema.
- **Rápido Clique (Debounce):** Garantir que o `isTransitioning` bloqueie múltiplos cliques no botão Next.

## 5. Próximo Passo
Aguardando `/vibe-apply` do usuário para escrever os códigos.
