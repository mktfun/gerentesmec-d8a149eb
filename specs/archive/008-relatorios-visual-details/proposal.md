# Requisitos e Contexto

## Problema
A visualização atual das sub-pontuações de cada etapa (linha expandida da tabela de gerentes) é apenas um texto simples indicando a porcentagem (ex: `100%`, `33%`). Isso dificulta a rápida absorção visual dos dados, pois não há indicação por cores (vermelho para ruim, verde para bom) nem elementos gráficos (barras) para auxiliar a rápida identificação de gargalos de atendimento do gerente.

## Objetivos
- Melhorar a experiência visual ao expandir a linha de um gerente.
- Incorporar **Progress Bars (barras de progresso) horizontais** junto aos números.
- Adicionar cores contextuais aos números e às barras, baseadas na nota (Vermelho < 50%, Amarelo 50-74%, Verde >= 75%).
- Tornar o layout mais limpo e "Premium", usando a estética de vidro e transparência (Liquid Glass / Modern UI).

## BDD Scenarios

### Cenário: Visualizar Pontuação Ruim
- **Given (Dado):** Um sub-item "4b. Pediu Google Reviews" possui média de 0%.
- **When (Quando):** O administrador expandir a linha do gerente.
- **Then (Então):** A interface deve exibir `0%` com a fonte e a barra de progresso preenchidas na cor vermelho vibrante (Rose-500), alertando rapidamente sobre o gargalo.

### Cenário: Visualizar Pontuação Excelente
- **Given (Dado):** O sub-item "1a. Cordial e respeitoso" possui média de 100%.
- **When (Quando):** O administrador expandir a linha.
- **Then (Então):** A interface exibirá `100%` com tipografia e barra preenchidas em cor verde/esmeralda (Emerald-500), dando reforço positivo visual.
