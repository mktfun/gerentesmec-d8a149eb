# Implementação - Executive TV Mode (Spec 069)

- [ ] **1. Fundação da Rotação (Wrapper)**
  - [ ] Criar arquivo `src/pages/tv/ExecutiveTvMode.tsx` (nova rota limpa, escondendo sidebars).
  - [ ] Implementar hook `useEffect` com `setInterval` e estado de `activeScreen` variando de 0 a 2.
  - [ ] Adicionar botão sutil de "engrenagem" para configurar o tempo do loop.
  - [ ] Conectar ao `AppDataContext` para baixar globalmente os leads (vendas) e audits (checklist físico).

- [ ] **2. Tela 1: Radar de Vacilos**
  - [ ] Criar sub-componente `TvRadarView.tsx`.
  - [ ] Filtrar os piores scores de conversas.
  - [ ] Layout de cards com `bg-black/50`, `border-zinc-800` e títulos enormes (`text-3xl`).
  - [ ] Renderizar bloco da "A Prova" com itálico e `bg-zinc-900`.
  - [ ] Incluir lib de QR Code (`react-qr-code` ou similar) apontando para API do WhatsApp (`wa.me/numero_gerente?text=...`).

- [ ] **3. Tela 2: O Semáforo (Ranking)**
  - [ ] Criar sub-componente `TvSemaforoView.tsx`.
  - [ ] Implementar Leaderboard da rede calculando o TMR e/ou o Average Score por unidade.
  - [ ] Renderizar grandes círculos/barras baseadas na faixa de nota: Verde (>80%), Amarelo (60-80%), Vermelho (<60%).
  - [ ] Criar Painel da Direita para o "Card Ouro" (gerente com maior score).
  - [ ] Criar Painel da Direita para o "Card Trágico" (reutilizando a lógica do Radar).

- [ ] **4. Tela 3: Raio-X Operacional (Mural de Evidências Físicas)**
  - [ ] Criar sub-componente `TvOperationsView.tsx`.
  - [ ] **Leaderboard de SLA (Esquerda):** Calcular e ordenar lojas baseado em datas da tabela de Vistorias/Auditorias Diárias (Checklist de Loja). Destacar em vermelho e alerta piscante quem estiver com inspeção atrasada (>24h).
  - [ ] **Mural Não Conforme (Direita):** Puxar as últimas 4 anomalias do array de `evidences` registradas no Supabase Storage.
  - [ ] Renderizar grid `grid-cols-2` com fotos `object-cover` gigantes preenchendo a caixa.
  - [ ] Adicionar a tarja preta translúcida com nome da Loja, Equipamento falho e o comentário (`notes`).
  - [ ] Gerar QR code de WhatsApp atrelado ao lado do grid.

- [ ] **5. UX e Refinamento**
  - [ ] Escalonar todos os textos base com prefixo `2xl:` ou apenas usar classes customizadas fortes, removendo limitações responsivas já que o formato TV (16:9 1080p ou 4K) é fixo.
  - [ ] Testar animações do `framer-motion` para intercalar as 3 views sem engasgos.
