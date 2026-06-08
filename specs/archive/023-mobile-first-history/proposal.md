# Proposal: 023-mobile-first-history

## Requisitos
1. Substituir a navegação mobile (que está quebrada) por um menu flutuante unificado baseado na referência do "LumaBar", equipado com animações fluidas (`framer-motion`) e efeito "Liquid Glass".
2. Esse menu deve ficar visível apenas no mobile para Administradores (no desktop, a Sidebar original continua), ou substituir a Sidebar atual totalmente (a definir no Design, assumiremos que substituirá a navegação mobile para o Admin, e será o menu padrão do Gerente).
3. Criar a página de Histórico de Vistorias (`/historico-auditorias`), com uma lista das auditorias já realizadas.
4. Construir uma visualização detalhada da vistoria, apresentando a nota final, as fotos armazenadas no Supabase e os selos de conformidade.

## User Stories
- **Como Administrador/Auditor**, eu quero acessar o sistema pelo celular e navegar com um LumaBar inferior incrível para não ficar preso na tela inicial, além de poder consultar os resultados das vistorias anteriores.
- **Como Gerente**, eu quero usar meu tablet para ver o Histórico de Vistorias da minha unidade usando o mesmo LumaBar flutuante, sem ter a opção de me auto-auditar.

## Critérios de Aceite
- O menu LumaBar tem um glow dinâmico que segue a aba ativa usando framer-motion `layoutId`.
- Tooltips aparecem no desktop/hover.
- A página de Histórico exibe as auditorias em Cards.
- Clicar em um Card no mobile expande a vistoria preenchendo a tela.
- Fotos carregam corretamente pelo Supabase Storage.

## BDD Scenarios

### Cenário: Navegação Mobile via LumaBar
- **Given:** O Administrador está acessando o Dashboard pelo celular.
- **When:** Ele entra no sistema.
- **Then:** A Sidebar padrão fica oculta e o LumaBar aparece no bottom da tela, permitindo navegar entre Dashboard, CRM, Auditoria e Histórico.

### Cenário: Visualização de Histórico com Sucesso
- **Given:** Uma vistoria foi realizada e salva no banco de dados com fotos.
- **When:** O Gerente navega até o Histórico de Auditorias e clica no card da vistoria mais recente.
- **Then:** O sistema abre a visão detalhada, exibindo a nota (ex: 85%), e uma lista dos itens inspecionados com suas respectivas miniaturas fotográficas e as observações.
