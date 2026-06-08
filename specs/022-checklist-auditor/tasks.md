# Checklist de Tarefas: App Auditor (022)

## Fase 1: Backend & Storage (Supabase)
- `[ ]` Criar migration SQL para tabelas `audits` e `audit_answers`.
- `[ ]` Criar bucket de storage `audit_evidences` (com regras RLS adequadas para upload anônimo ou do auth token atual).
- `[ ]` Atualizar tipos TypeScript (`supabase gen types`).

## Fase 2: Estrutura do Checklist (Frontend)
- `[ ]` Criar arquivo com constante dos dados do checklist (`CHECKLIST_TEMPLATE`) divididos nas 4 categorias pedidas (Recepção, Área de Vivência, Oficina, Ferramental).
- `[ ]` Criar a página base `/checklist` e adicioná-la às rotas do React (`App.tsx`).

## Fase 3: UI/UX Components
- `[ ]` Criar o componente de **Onboarding/Setup** (Seleção de unidade com layout premium).
- `[ ]` Criar o componente de **Card do Item Atual**, garantindo o visual Maximalista e Liquid Glass.
- `[ ]` Implementar o **Botão de Câmera nativo** (`<input type="file" capture="environment">`) e a lógica de exibição de Thumbnail (usando URL.createObjectURL temporário).
- `[ ]` Implementar a trava dos botões "Conforme/Não Conforme" (disabled state até a foto existir).
- `[ ]` Implementar acordeão animado para a "Observação Opcional".

## Fase 4: Integração (Antigravity Code-Glue)
- `[ ]` Desenvolver função para fazer upload da foto (Blob/File) para o Supabase Storage em background.
- `[ ]` Conectar o botão final "Enviar Relatório" para dar `INSERT` na tabela `audits` e `audit_answers`.
- `[ ]` Aplicar Skill `ux-ui-architect-2026` e revisar contrastes e micro-animações.
