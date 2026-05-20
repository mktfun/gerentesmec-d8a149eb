# Research: Actionable Insights & Premium UI Revert (014)

## 1. Contexto do Pedido
O usuário fez uma crítica excelente ao paradigma clássico de Dashboards: "O Daniel não quer entrar e ver vários cards e dados sem entender como isso impacta ele e sem saber o que fazer com isso".
Ter um gráfico radar mostrando que "Up-sell está em 20%" é inútil se o sistema não disser o que isso significa em dinheiro e qual a ação para corrigir.

**Objetivo Duplo:**
1. Restaurar a **Aura Premium** do design anterior (O card gigante no topo, 100% de elegância visual, TV Mode impressionante).
2. Transformar dados frios em **Insights Acionáveis (Gargalos e Planos de Ação)**. O sistema deve mastigar o dado e dar a resposta pronta para o CEO.

## 2. Análise do Problema (Dados vs Insights)

### Como é hoje:
- *Radar Chart:* Mostra que Dom Pedro tem pontuação baixa em "Up-sell".
- *Tempo Médio:* Mostra "14m".

### Como deve ser (Actionable):
- O sistema processa os leads e o score.
- Renderiza uma seção de **"🚨 Gargalo Atual"**: "A unidade Dom Pedro está derrubando a média da rede por não enviar orçamentos em menos de 20 minutos. Impacto estimado: R$ 4.500 na mesa."
- Renderiza **"🎯 Ação Recomendada"**: "Cobrar gerente Renato Silva sobre a esteira de orçamentos e revisar a etapa 2 do checklist."

## 3. Implicações Técnicas
Para fazer isso estaticamente agora (já que não temos IA conectada rodando as queries ainda), criaremos um gerador de Insights baseado em regras no `mockData.ts` ou direto no `Index.tsx`, que olha para os arrays de mock e gera 1 a 2 frases de impacto.
- **TV Mode:** Em vez de só mostrar os scores gigantes, o TV Mode deve exibir o "Foco do Dia" (ex: "Bater meta de resposta rápida na unidade Kennedy").
- **Relatórios:** Além de comparar períodos, a aba de relatórios vai ter um log de "Oportunidades Perdidas" explicando o *porquê* o faturamento não foi maior.
