# Requisitos e Contexto

## Problema
1. **Pontuações de Unidades 100%:** Na tabela de performance por unidade/gerente na tela de Relatórios, quase todos os gerentes apresentam pontuação 100% nas etapas E1, E2, E3 e E4. Apenas um está com 0%. Isso acontece porque o cálculo (`checklist['1a'] ? 1 : 0`) avalia a string `"false"` como uma condição verdadeira, computando pontos indevidos.
2. **Organização do Histórico:** A tabela "Histórico de Auditorias" na parte inferior da tela de Relatórios carrega todos os leads auditados de uma vez, tornando a visualização confusa e difícil de navegar. Faltam paginação e melhor detalhamento visual.

## Objetivos
- Corrigir a métrica de etapas, garantindo que o valor booleano (`true`) ou a string (`"true"`) sejam as únicas formas de pontuar.
- Refatorar a tabela de Histórico de Auditorias, adicionando **Paginação** (ex: 10 itens por página).
- Melhorar o visual da tabela de histórico para facilitar a leitura.

## BDD Scenarios

### Cenário: Cálculo de Performance das Etapas
- **Given (Dado):** Um gerente tem um lead com o checklist contendo o valor `"false"` (string) para o item `1a`.
- **When (Quando):** A tela de Relatórios calcular a performance do E1 (Cordialidade).
- **Then (Então):** Aquele item `"false"` deve contar como `0` na pontuação (não como `1`), refletindo a porcentagem correta (ex: 50% ou 0%) na tabela.

### Cenário: Navegação do Histórico
- **Given (Dado):** A conta possui 25 leads auditados.
- **When (Quando):** O usuário visualizar o Histórico de Auditorias.
- **Then (Então):** O usuário deve ver uma tabela com as primeiras 10 linhas, exibindo controles visuais de paginação ("Página 1 de 3", Botões "Anterior" e "Próxima"). Ao clicar em "Próxima", a tabela exibe os leads de 11 a 20.
