# Tasks: Melhorias no Relatório PDF (V2)

- [ ] **Frontend**: Atualizar a interface em `src/pages/Relatorios.tsx`.
  - [ ] Ao preparar `pdfData`, agrupar a constante `reportTargetLeads` por `unit_id`.
  - [ ] Renderizar no JSX o título e cabeçalho de cada Unidade (pesquisar nome na constante `units` baseada no `unit_id`).
  - [ ] Para cada Lead renderizado, buscar o nome do Gerente via `lead.manager_id` no array `managers`, exibindo "Gerente: Nome" ao lado do nome da unidade ou no cabeçalho do lead.
  - [ ] Adicionar a classe CSS `break-inside-avoid` (ou `print:break-inside-avoid`) e estilos para evitar cortes de texto no meio nas bolhas de `msg.content`.
  - [ ] Refatorar a cor de fundo das bolhas de mensagem. Remover as cores sólidas e aplicar uma borda lateral (`border-l-4`) ou um tom de cinza hiper leve (`bg-zinc-50`), assegurando que a fonte fique legível (preta ou grafite).

- [ ] **QA/UI Review**:
  - [ ] Verificar se as unidades estão bem separadas no arquivo impresso.
  - [ ] Garantir que mensagens muito longas não são divididas entre as folhas A4 ao tentar renderizar.
  - [ ] Checar se a leitura do documento transmite a "vibe" corporativa e sóbria que o CEO (Daniel) espera ler.
