# Tasks: Gêmeo Local 2.0 (Automação em Lote + Zero Contexto)

- [ ] Super Prompt (Documentação `scripts/ai-cli-runner.md`)
  - [ ] Apagar o conteúdo atual e escrever o Prompt Mega-Agnóstico.
  - [ ] Adicionar o Schema exato de Payload JSON que a UI espera (`audit_checklist`, `audit_reasons`, `score`, `closing_summary`).
  - [ ] Adicionar o Schema do Banco (estrutura explicada de `leads` e `chat_messages`).
  - [ ] Descrever os passos algoritmos exatos (GET fila -> Loop Histórico -> Avaliar -> PATCH banco).

- [ ] Interface (React)
  - [ ] Modificar o `AdvancedAiPanel.tsx`.
  - [ ] Alterar a text-area para carregar dinamicamente o texto do arquivo `scripts/ai-cli-runner.md` ou ter o texto *hardcoded* lá.
  - [ ] Injetar as variáveis de ambiente ativas no Front-end (`import.meta.env.VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) diretamente no bloco do Prompt, para o gerente não ter que caçá-las.
  - [ ] Atualizar o botão "Copiar Prompt" para copiar essa massa gigantesca de texto mastigada pronta pro uso.
