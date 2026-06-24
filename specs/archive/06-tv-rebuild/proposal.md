# Spec 06: TV Rebuild (Imersão e Radar de Qualidade)

## Contexto
O usuário reportou que os Dashboards de TV (`/tv/executivo` e `/tv/operacional`) estão "feios", "disfuncionais", e quebram a imersão (exibindo o Sidebar e o Header quando acessados pela URL). 
Além disso, a TV Operacional e o Radar Executivo carecem de dados relevantes quando não há auditorias muito ruins no dia atual, passando a impressão de que "o sistema não tem dados" ou "não rastreia nada".

## Boundaries (Limites e Contratos)
- As URLs `/tv/*` devem desencadear um "modo imersivo" de forma determinística, sem depender do clique no botão de Fullscreen. 
- O modo imersivo deve ser controlado a nível de Layout (`DashboardLayout.tsx`), garantindo que Menu e Header nunca sejam renderizados sob rotas `/tv/`.
- **Contrato de Dados da TV**: Os dashboards devem expandir seu espectro de busca. Se as auditorias restritas a < 60% hoje retornarem 0, o fallback deve pescar os casos ruins da *semana inteira* e expandir a nota máxima do "Radar da Vergonha" para < 75%. Além disso, listar os casos de "Loss" (orçamentos abandonados) para preencher a tela caso a IA não tenha avaliado as conversas do dia ainda.

## Ambiguidades (Clarify)
O usuário será questionado durante a aprovação do plano (artifact UI):
- Qual é o critério exato de fallback se não houver notas muito ruins hoje? (Ex: puxar a semana toda ou apenas puxar casos que fecharam sem venda "Morreu no Funil").

## Mutações de Estado (State Mutations)
Nenhuma tabela do banco será alterada.
O contexto Global (`AppDataContext`) não sofrerá mutação, apenas a camada de apresentação (`UnitOperationalSlide.tsx` e `TvRadarView.tsx`) e do roteamento `DashboardLayout.tsx` será estendida.
