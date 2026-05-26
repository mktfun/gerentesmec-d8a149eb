# Tarefas - Grid Operacional

- [ ] **Passo 1:**
  - Em `TvOperacional.tsx`, substituir o layout de colunas antigas por uma estrutura flexível orientada a Grid de Cards (Gerentes).
  - Manter o Header principal com os dados macro agregados (TMR Geral, Fila Total, Atendimento Total).
- [ ] **Passo 2:**
  - Renderizar o `.map(manager)` gerando um cartão completo para cada unidade.
  - Implementar lógica interna do cartão para calcular TMR específico do gerente e identificar leads críticos atribuídos a ele.
- [ ] **Passo 3:**
  - Adicionar o brilho condicional `rose-500` aos cartões dos gerentes que tiverem SLAs violados, direcionando o foco do gerente operacional diretamente para o culpado do gargalo.
