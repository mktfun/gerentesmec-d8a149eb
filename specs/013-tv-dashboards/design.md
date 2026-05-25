# Design & Arquitetura de UI/UX

## Apple Liquid Glass & Maximalismo Tátil (2026 Trend) - TV Dashboards
1. **Tipografia Gigante (Maximalismo):** TMR e Scores devem usar fontes acima de `6xl` a `8xl`.
2. **Liquid Glass:** Fundos em `bg-black/40 backdrop-blur-3xl` e contornos neon sutis.
3. **Alto Contraste:** Cores de sinalização óbvias.
4. **Data Visualization:** Anéis grandes que se preenchem sozinhos.

### `TvOperacional.tsx`
- **Destaque Principal:** "Clientes Aguardando" (Número Gigante vermelho se houver SLA estourado).
- **Cards Menores:** Tempo Médio de Resposta (TMR).
- **Lista Animada:** Painel inferior/lateral com os leads ativos/urgentes.

### `TvExecutiva.tsx`
- **Destaque Principal:** Score Global de Atendimento (Ex: "91% Qualidade de Auditoria").
- *Sem dados de Financeiro em orçamentos não garantidos.*
- **Ranking:** Pódio dos Top 3 Gerentes em tempo real.
- **Gráfico/Bars:** Qualidade por Unidade e Volume de Atendimentos.

---

## Refatoração Modal `Relatorios.tsx`
Para termos uma leitura executiva limpa no modal de Relatórios:
Vamos criar o componente `ReadOnlyAuditPanel.tsx`.
- Ele dividirá o espaço com o `ChatHistoryView` (igual ao Kanban).
- **Lado Esquerdo:** O chat normal.
- **Lado Direito (ReadOnly):** 
  - Nota grande circular.
  - Lista de itens agrupados (`auditStepsConfig`).
  - Cada item exibe um Check Verde (Pontuou) ou um X Vermelho (Não pontuou).
  - Ícone de "Mira/Alvo" ao lado dos itens que pontuaram para rolar o chat até a evidência.
  - O resumo/dossiê da IA textual em uma caixa de texto simples e estilizada.
  - *Nenhum botão de Salvar, nenhum input.*
