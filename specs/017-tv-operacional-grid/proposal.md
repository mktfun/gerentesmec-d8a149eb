# Rework Operacional: Grid de Unidades

## Contexto e Lacunas Identificadas
O usuário enviou um print mostrando que a tela Operacional possuía listas gigantes (45 na fila de espera, 103 em atendimento). Isso quebra o propósito de uma TV, pois TVs não rolam a tela (scroll) e o excesso de nomes torna a informação não-acionável ("cega"). A visão precisa ser agregada, compacta e orientada à cobrança das unidades.

## Requisitos

### 1. Novo Layout (Grid de Gerentes)
A tela `/tv/operacional` será redesenhada para não exibir mais longas listas de nomes de clientes (a menos que seja um alerta crítico isolado). Em vez disso, a tela principal será dividida em um **Grid de Cards por Unidade/Gerente**.

### 2. Visão Geral Compacta
Um cabeçalho (ou barra lateral) com os grandes números da oficina toda:
- TMR Geral
- Leads Aguardando Atendimento (Soma total)
- Total de Veículos em Box (Orçamentos/Negociações)

### 3. Visão Detalhada por Unidade (Cards)
Para cada gerente, um card compacto exibindo:
- **TMR da Unidade**
- **Fila de Espera:** Quantos `lead_new` estão parados com aquele gerente.
- **Produção:** Quantos leads em `negotiation` e `quote`.
- **Alertas Críticos:** Se houver clientes com SLA estourado para esse gerente, o card pisca suavemente as bordas em vermelho e exibe "X Atrasados".

## BDD Scenarios

### Cenário: Identificando o Gargalo
- **Given (Dado):** que a oficina tem 45 clientes aguardando.
- **When (Quando):** o gerente operacional bate o olho na tela.
- **Then (Então):** a visão não é uma lista infindável, mas sim cards de 4 unidades, mostrando claramente que a Unidade A tem 40 clientes parados e a Unidade B tem 5.
- **And (E):** o card da Unidade A brilha em alerta vermelho, tornando óbvio quem precisa ser cobrado para agir.
