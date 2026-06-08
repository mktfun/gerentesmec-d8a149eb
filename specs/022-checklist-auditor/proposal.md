# Proposal: App de Checklist de Auditoria

## Objetivo
Criar um módulo de Checklist dentro do WebApp focado na execução de auditorias presenciais nas unidades físicas (oficinas). A experiência deve mimetizar o fluxo premium de aplicativos como SafetyCulture e Produttivo, garantindo que o auditor seja forçado a documentar visualmente (com foto nativa da câmera) o estado de diversos setores da oficina para comprovar o padrão de qualidade.

## Requisitos e User Stories

### Requisitos Funcionais
- [ ] A tela de Checklist deve iniciar solicitando a seleção da Unidade a ser auditada.
- [ ] O sistema deve exibir os itens de verificação organizados em 4 categorias (Recepção, Área de Vivência, Oficina, Ferramental).
- [ ] A visualização principal deve ser em Cards focados, exibindo apenas um item ou uma lista bem espaçada, impedindo que o auditor se perca.
- [ ] **Trava de Câmera (Obrigatória):** O botão de "Conforme / Não Conforme" ou de Avanço para o próximo item deve ficar bloqueado (disabled) até que a foto obrigatória seja tirada.
- [ ] **Câmera Direta:** O botão de foto deve utilizar `<input capture="environment">` para abrir a câmera nativa e desencorajar o upload de fotos antigas da galeria.
- [ ] **Observação (Opcional):** Um botão de "Adicionar Observação" oculto/minimalista que abre um campo de texto caso clicado.
- [ ] **Review Final:** Após preencher os cards, o auditor vê uma tela de sumário antes de assinar/submeter.

### User Stories
- **Como Auditor**, eu quero selecionar uma unidade antes de começar, para que a avaliação fique atrelada ao local correto.
- **Como Auditor**, eu quero abrir a câmera com apenas um clique para capturar uma irregularidade na hora sem perder tempo.
- **Como Gerente**, eu quero ter certeza de que o auditor realmente tirou a foto no momento da inspeção para evitar relatórios forjados.
- **Como Auditor**, eu quero que a tela seja limpa e tenha botões grandes de ✅ e ❌ para facilitar o clique quando estiver andando na oficina.

## BDD Scenarios

### Cenário: Tentativa de avançar sem tirar a foto obrigatória
- **Given (Dado):** O auditor está avaliando o item "Elevadores Automotivos" e ainda não acionou a câmera.
- **When (Quando):** Ele tenta clicar no botão "Próximo Item" ou em "Salvar".
- **Then (Então):** O botão está cinza/bloqueado e o sistema exibe uma dica visual ("📸 Foto da evidência é obrigatória").

### Cenário: Adição de uma observação em caso Não Conforme
- **Given (Dado):** O auditor está no item "Piso do Pátio".
- **When (Quando):** Ele clica em ❌ "Não Conforme" e tira a foto de uma poça de óleo.
- **Then (Então):** O sistema libera o botão de avançar, mas também expande automaticamente (ou sugere) o campo de "Adicionar Observação" para que ele justifique o problema.

### Cenário: Abertura da câmera e captura
- **Given (Dado):** O auditor clica no botão "Tirar Foto" no item "Banheiro de Clientes".
- **When (Quando):** A câmera do dispositivo mobile abre diretamente apontando para o ambiente. Ele captura e confirma.
- **Then (Então):** O WebApp substitui o botão pela miniatura da foto tirada (thumbnail) e libera os controles para a próxima etapa.
