# Workflow: /auditoria-mensal

Este é um workflow autônomo. Quando o usuário invocar `/auditoria-mensal`, você (Agente Master) deve seguir rigorosamente as etapas abaixo sem pedir permissão ou travar, entregando os relatórios no final.

## Objetivo
Rodar o Pipeline de Auditoria Semântica QA na rede inteira de oficinas Tork, avaliando apenas os atendimentos que ocorreram nos **últimos 30 dias**, e gerar o Painel Comparativo consolidado do Mês.

## Passo a Passo de Execução

1. **Extração Temporal (Mês):**
   - Execute o script `extract_all_units.mjs` com a flag temporal: `node extract_all_units.mjs --period=month`.
   - Aguarde o script finalizar. Ele apagará as pastas antigas e criará as pastas `conversas_*` populadas APENAS com conversas do mês atual, limitando-se às regras de qualidade de no máximo 15 clientes por unidade.

2. **Lançamento do Esquadrão (Subagentes):**
   - Use o comando `invoke_subagent` para disparar 1 subagente para CADA unidade que gerou conversas (verifique as pastas com o comando de listar diretório).
   - O prompt do subagente deve instruí-lo a ler a sua respectiva pasta, aplicar as 12 Regras OiAPI baseando-se no `Documentacao_Pipeline_Auditoria.md`, e criar o `Relatorio_Semantico_<UNIDADE>.html` na pasta do Brain.
   - **Aguarde em background** sem laços ou polling até que TODOS os subagentes terminem. O sistema vai te notificar das entregas.

3. **Injeção de Links e CSS:**
   - Mova os arquivos `.html` gerados no Brain para o diretório de destino `Painel_Auditorias/`.
   - Execute o script `node add_links_and_styles.mjs` para corrigir a formatação CSS das análises e injetar os links que levam direto à conversa original do Chatwoot no cabeçalho de cada cliente.

4. **Injeção do Gráfico Detalhado de Pilares:**
   - Execute o script `node update_charts.mjs` para ler os HTMLs e gerar, matematicamente, o acordeão visual de notas percentuais e regras expandidas.

5. **Geração do Painel Comparativo:**
   - Leia os placares extraídos de cada arquivo `.html` recém-gerado.
   - Atualize ou crie o arquivo `Painel_Comparativo_Rede_Mensal.html` (ou use o base `Painel_Comparativo_Rede.html`) consolidando o ranking oficial de qualidade do mês.

6. **Apresentação Final:**
   - Responda ao usuário avisando do término com as análises gerais de quem subiu ou desceu de nota e forneça os links diretos para os arquivos em HTML!
