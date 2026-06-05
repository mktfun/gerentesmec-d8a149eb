# Walkthrough: Smart Cutoff & Rolling 30 Days (011-score-rules)

## Resumo das Entregas

Toda a infraestrutura de Score Justo ("Cutoff Inteligente") e a consistência visual de 30 dias foram implementadas. O sistema não precisa de migrações pesadas de banco, pois a correção é **retroativa**.

### 1. Cutoff Inteligente para Leads Perdidos
- **Frontend Dynamism (`scoreUtils.ts`):** O dashboard executivo, a visão do gerente e a TV Operacional não dependem mais da nota crua presa no banco de dados. Nós passamos a recalcular a nota "Ao Vivo".
- Se um lead for `closed_lost`, usamos a função mágica `calcLostScore`, que desconsidera imediatamente todos os passos à frente daquele que o gerente reprovou/parou. 
- *Exemplo real validado:* Se a conversa acabou na Etapa 2A, a nota do mecânico não divide mais por 12 pontos, divide por apenas 5. Se ele acertou 3, ele tem 60% e não 25%!
- **Backend Edge Function:** A inteligência da OpenAI (`ai-autonomous-evaluator`) agora possui um IF gigante protegendo a nota oficial gravada no banco. Toda vez que a IA fechar como "Perdido", a própria IA aplica a sua métrica restrita e registra apenas a nota justa.

### 2. Filtro Cirúrgico de 30 Dias nos Dashboards
- **Restauração do Módulo (`dashboardFilters.ts`):** A lógica que filtra leads Ganhos e Perdidos dos últimos 30 dias móveis (incluindo o dia de hoje, varrendo os últimos 29 dias para trás de forma progressiva) foi blindada.
- Em `Index.tsx`, `ManagerDashboard.tsx` e `TvDashboard.tsx`: O Ranking de Gerentes, a Média Global, o Histórico Diário e o Comparativo Semana x Semana **não tocam** mais em leads abertos (lead_new, quote) e **ignoraram** leads que já passaram dos 30 dias, despoluindo a tela inteira.

## Verificação
> [!NOTE]
> O comando `npm run build` foi aprovado com 0 erros. O Edge Function da IA está no ar de forma segura. O Git enviou a build com êxito pro Lovable/Supabase.

## Próximos Passos
Você já pode acessar os relatórios e painéis do Gerente e do Executivo. Dê uma conferida se algum gerente que estava com a nota ruim injustamente já não "subiu" no pódio do ranking com esse Cutoff automático!
