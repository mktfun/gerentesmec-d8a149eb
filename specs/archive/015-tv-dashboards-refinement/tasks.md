# Tarefas - Refinamento das TVs

- [ ] **Passo 1 (Sidebar Acesso Rápido):**
  - Modificar `src/components/Layout/Sidebar.tsx`.
  - Adicionar uma seção no final da barra lateral com Links/Botões com `target="_blank"` para `/tv/operacional` e `/tv/executivo`.
- [ ] **Passo 2 (Correção Lógica Operacional):**
  - Em `TvOperacional.tsx`, atualizar `activeLeads = leads.filter(...)` para buscar `funnel_stage` igual a `lead_new`, `negotiation` ou `quote` (e não `in_progress`).
- [ ] **Passo 3 (Ajustes de UI Operacional):**
  - Substituir fontes monstruosas `text-[8rem]` por `text-7xl md:text-8xl lg:text-9xl`.
  - Ajustar contraste de cores de alerta, trocando brancos esmaecidos `text-white/30` por `text-white/50` ou `/60`.
  - Diminuir paddings extremos nos cartões.
- [ ] **Passo 4 (Ajustes de UI Executivo):**
  - Em `TvExecutivo.tsx`, ajustar o SVG do Score para ter um tamanho fixo grande natural em vez de abusar de `scale-150` que deforma contêineres menores.
  - Ajustar o tamanho das tipografias e espaçamentos dos cards dos Top 3 gerentes para caberem suavemente na tela.
