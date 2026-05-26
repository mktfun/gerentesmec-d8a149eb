# Refinamento dos TV Dashboards

## Contexto e Lacunas Identificadas
O usuário relatou dois problemas críticos com a primeira versão dos TV Dashboards:
1. **Acessibilidade Ruim:** Não existe um botão na interface principal do sistema para abrir as telas de TV facilmente. É necessário digitar a URL manualmente.
2. **Visualização Desproporcional e Dados Incorretos:** 
   - A tipografia utilizada nas métricas gigantes (`8rem`) quebrou o layout em monitores padrão, resultando em um visual grosseiro em vez de premium.
   - Os dados do Dashboard Operacional estão incorretos ("informações não tão certas") porque a lógica de filtragem de leads ativos estava buscando por `in_progress` (que não existe mais no nosso CRM) em vez de `negotiation` e `quote`.

## Requisitos
- **Botões de Acesso Rápido:** Criar um menu ou botões na Sidebar (menu lateral) para "Modo TV - Operacional" e "Modo TV - Executivo", que ao clicados abrem em uma nova aba (`target="_blank"`).
- **Ajuste de Escala Visual (UI):** Refinar o Maximalismo. Reduzir as fontes extremas de `text-[8rem]` para tamanhos responsivos controlados (ex: `text-7xl` a `text-9xl` do Tailwind), melhorando os paddings e alinhamentos para que o design Liquid Glass fique elegante e não desajeitado.
- **Correção da Lógica de Dados (Operacional):** Consertar o filtro de contatos ativos no `TvOperacional.tsx` para refletir as etapas corretas do Kanban (`lead_new`, `negotiation`, `quote`). Garantir que os alertas vermelhos correspondam estritamente a essas etapas ativas.

## BDD Scenarios

### Cenário: Abrindo a TV a partir do Menu
- **Given (Dado):** que o usuário está no Kanban (`/crm`).
- **When (Quando):** ele clica no novo botão "Modo TV" na barra lateral.
- **Then (Então):** uma nova aba é aberta no navegador na rota `/tv/operacional`, em tela cheia e pronta para ser colocada na televisão.

### Cenário: Exibição Correta de Atendimentos Ativos
- **Given (Dado):** que existem 5 leads em "Em Negociação" (negotiation) e 2 em "Novo Lead" (lead_new).
- **When (Quando):** a tela da TV Operacional é renderizada.
- **Then (Então):** o carrossel de atendimentos exibe exatamente 7 cards, e os cálculos de SLA verificam o tempo de resposta desses 7 clientes.
