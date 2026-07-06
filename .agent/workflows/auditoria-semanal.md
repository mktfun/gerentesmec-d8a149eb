# Workflow: /auditoria-semanal

Este é um workflow autônomo. Quando o usuário invocar `/auditoria-semanal`, você (Agente Master) deve seguir rigorosamente as etapas abaixo sem pedir permissão ou travar, entregando os relatórios no final.

## Objetivo
Rodar o Pipeline de Auditoria Semântica QA na rede inteira de oficinas Tork, avaliando apenas os atendimentos que ocorreram nos **últimos 7 dias**, e gerar o Painel Comparativo.

## Passo a Passo de Execução

1. **Extração Temporal (Semana):**
   - Execute o script `extract_all_units.mjs` com a flag temporal: `node extract_all_units.mjs --period=week`.
   - Aguarde o script finalizar. Ele apagará as pastas antigas e criará as pastas `conversas_*` populadas APENAS com conversas da semana atual.

2. **Lançamento do Esquadrão (Subagentes):**
   - Use o comando `invoke_subagent` para disparar 1 subagente para CADA unidade que gerou conversas (verifique as pastas).
   - O prompt do subagente deve instruí-lo a ler a sua respectiva pasta, aplicar as 12 Regras OiAPI baseando-se no `Documentacao_Pipeline_Auditoria.md`, e criar o `Relatorio_Semantico_<UNIDADE>.html` na pasta do Brain.
   - **Aguarde em background** (não consuma tokens com loops) até que TODOS os subagentes terminem.

3. **Injeção de Links e CSS:**
   - Mova os `.html` gerados no Brain para `Painel_Auditorias/`.
   - Execute o script `node add_links_and_styles.mjs` para corrigir estilização de CSS e injetar o link do Chatwoot no header de cada cliente.

4. **Injeção do Gráfico Detalhado de Pilares:**
   - Execute o script `node update_charts.mjs` para calcular a matemática do desempenho das regras HTML recém-criadas e acoplar a interface visual do Acordeão expansível.

5. **Geração do Painel Comparativo:**
   - Leia as notas gerais de cada arquivo `.html` recém-gerado.
   - Escreva o arquivo `Painel_Comparativo_Rede.html` consolidando o ranking de qualidade da semana.
   - Atualize a mensagem principal (ex: "Síndrome do Tirador de Pedido") baseando-se no que foi a realidade da semana atual.

6. **Apresentação:**
   - Responda ao usuário com o link final do Painel Comparativo da Semana!
