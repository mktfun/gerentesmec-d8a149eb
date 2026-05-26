# Proposal: Redesign Revolut & Escalabilidade de Unidades

## Identificador
`018-revolut-dash-and-tv`

## O Problema
Com o crescimento das unidades cadastradas, a interface original "quebrou". O layout do Dashboard e o Kanban ficaram apertados e inviáveis, e a TV perdeu o visual de Comando Central. A atual experiência é estática e precisa de transições mais modernas, responsivas e escaláveis para dezenas de unidades simultaneamente.

## A Solução (Revolut Vibe)
Transformar a UI aplicando a "Vibe Revolut Bank": fluidez absurda, elementos de UI perfeitamente redondos e contrastantes, suporte impecável a Dark/Light mode, animações de layout com `framer-motion` e reorganização espacial focado em **Score e SLA**.

### Requisitos Funcionais e Visuais
1. **Dashboard (`Index.tsx`)**: O bloco de "Scores das Unidades" será um slider/carrossel arrastável e com paginação ou um card summary expansível.
2. **Kanban Switcher (`Crm.tsx`)**: As abas superiores horizontais darão lugar a um seletor inteligente "Pill Dropdown" com menu animado flutuante. Ao abrir o menu, as unidades estarão listadas com seus respectivos Scores Atuais em badges (focando no que importa).
3. **Comando Central (TV Mode)**:
   - Dividir os cards em **Páginas** (ex: 3 cards por página).
   - O sistema rotacionará as páginas automaticamente (`setInterval`).
   - Adicionar controles discretos no Header: [15s] [30s] [1m] e [Sair].
   - Transições de slide com efeito suave (opacity + blur + slide).

## BDD Scenarios

### Cenário: Navegação Inteligente no Kanban
- **Given (Dado):** que existam 10 unidades cadastradas.
- **When (Quando):** o usuário entrar no CRM/Auditoria.
- **Then (Então):** as unidades não estarão esmagadas. Haverá um único botão arrojado no Topbar indicando a unidade atual. Ao clicar, um menu suspenso elegante (estilo Apple) revela as outras unidades, ordenadas por Score ou SLA, permitindo a troca com animação cross-fade.

### Cenário: Rotação do Comando Central (Modo TV)
- **Given (Dado):** que a TV está projetando 8 unidades.
- **When (Quando):** a página iniciar no "Modo TV".
- **Then (Então):** a tela mostrará as 3 primeiras unidades em proporções épicas. Após 15 segundos (se este for o tempo selecionado no topo), a página desliza fluidamente (sem reload) revelando as próximas 3 unidades.

### Cenário: Dark / Light Mode Revolut
- **Given (Dado):** que a estética é baseada em Fintechs premium.
- **When (Quando):** o usuário alternar o tema do sistema na Sidebar.
- **Then (Então):** os componentes devem reagir suavemente alterando sombras "Liquid Glass", com branco puro e preto verdadeiro (`#050508`), garantindo acessibilidade e contraste dinâmico sem perder a "vibe" dopamínica.
