# Tarefas de Implementação

- [x] **Passo 1 (Prompt & Regras):** Acessar a tela de "Ajustes de IA" ou o banco de dados e modificar o `system_prompt`. Inserir a regra do Golden RAG (exemplo Carijós) e forçar que a aprovação dependa estritamente do envio prévio de link de checklist/orçamento.
- [x] **Passo 2 (Avaliação Multimodal de Mídia):** Modificar o prompt do `ai-autonomous-evaluator` para instruir o Gemini 1.5 a assistir/ouvir ativamente as mídias. Se o vídeo/áudio for curto (ex: < 2 min) ou não contiver explicação aprofundada (o quê e o porquê o cliente tem que pagar), pontuar 0 nas etapas de explicação de orçamento e upsell.
- [x] **Passo 3 (Permissões de Loja):** Atualizar o `AppDataContext` ou a lógica de roteamento para identificar o perfil logado.
- [x] **Passo 4 (Filtro Travado):** Na tela de Relatórios e de CRM, travar o filtro `selectedUnit` para a unidade logada caso o usuário não seja Admin global. Ocultar o dropdown de lojas ou renderizá-lo como `<select disabled>`.
