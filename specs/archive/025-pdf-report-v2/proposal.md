# Proposal: Melhorias no Relatório PDF (V2)

## Requisitos
- **Agrupamento:** O PDF deve separar as auditorias por Unidade.
- **Identificação:** O cabeçalho de cada lead no PDF deve listar claramente o Nome do Gerente responsável, além do Veículo e Status.
- **Paginação:** Prevenir que mensagens individuais da transcrição sejam cortadas ao meio (split) entre páginas físicas do PDF.
- **Design:** Ajustar as cores de fundo (backgrounds) das bolhas de mensagens e dos blocos para algo mais sóbrio, limpo e profissional, evitando alto contraste excessivo.

## BDD Scenarios

### Cenário: Geração do relatório agrupado por unidade
- **Given (Dado):** O gerente tem leads problemáticos nas unidades "Loja Centro" e "Loja Sul".
- **When (Quando):** Ele clica em "Exportar PDF de Auditorias".
- **Then (Então):** O PDF exibe o cabeçalho "Unidade: Loja Centro" com seus leads respectivos, seguido de "Unidade: Loja Sul" com os seus, separados de forma clara.

### Cenário: Exibição do responsável pelo lead
- **Given (Dado):** Um lead com nota < 60 foi atendido pelo gerente "João Silva".
- **When (Quando):** O lead aparece no relatório PDF.
- **Then (Então):** O bloco de cabeçalho desse lead exibe "Gerente: João Silva" logo abaixo do nome do cliente.

### Cenário: Impressão sem corte de mensagens
- **Given (Dado):** Uma transcrição possui uma mensagem do cliente que ocupa 10 linhas.
- **When (Quando):** A janela de impressão (`window.print()`) faz a quebra de página.
- **Then (Então):** A mensagem do cliente é movida inteiramente para a página seguinte caso não caiba no restante da página atual, sem ser cortada horizontalmente no meio do texto.
