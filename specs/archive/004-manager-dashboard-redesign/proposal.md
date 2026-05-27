# Proposta: Redesign UX "TripGlide" para Mecânicos (Feature 004)

## 1. Requisitos
1. **Sistema Anti-Burro (UX à prova de falhas):** A interface deve possuir enormes alvos de clique, hierarquia cristalina de botões, contraste máximo e ícones descritivos óbvios, removendo a carga cognitiva excessiva dos painéis estilo neon complexos.
2. **Modo Claro e Escuro (Theme Toggle):** O sistema dos mecânicos deve se libertar da trava no modo noturno, permitindo intercalar entre o "Light Mode" da referência (fundo `#f5f6f7`, cartões brancos) e o "Dark Mode" (fundo `#212529`, cartões pretos off-black).
3. **Bottom Navigation "Pill":** Adotar o padrão estético da imagem de referência, flutuando a navegação como uma "Pílula" preta (ou branca reversa) na parte inferior da tela, concentrando as ações (Início, Sair) e removendo o header claustrofóbico superior.
4. **Cards em vez de Linhas:** Mudar a listagem de atendimentos ("Leads/Veículos") para imitar os pacotes de viagem da referência: Cards encorpados com fotos ilustrativas ou blocos de cor sólidos com tipografia limpa, tags redondas (Pills) para atraso ou status, e um botão claro de "Ler Ficha" (equivalente ao "Book a tour").

## 2. User Stories
- **Como Mecânico/Gerente de Loja**, eu quero uma interface clara, diurna e com letras grandes, **para que** eu consiga visualizar rapidamente qual carro/cliente precisa de minha atenção, mesmo estando com as mãos sujas ou na luz do sol da oficina.
- **Como Administrador**, eu quero que a visão da filial seja totalmente "anti-burro", **para que** a curva de aprendizado da equipe ao abrir o celular seja quase zero, evitando cliques errados ou confusão sobre onde tocar.

## 3. BDD Scenarios

### Cenário: Alternância de Temas (Claro/Escuro)
- **Given (Dado):** O gerente está acessando o `ManagerDashboard` debaixo de sol forte na oficina.
- **When (Quando):** Ele toca no ícone de "Sol" na navegação inferior.
- **Then (Então):** A tela deve transicionar imediatamente o esquema de cores para fundos `#f5f6f7`, fontes pretas `Instrument Sans` e cartões brancos, removendo todo traço de dark-mode neon para máxima visibilidade.

### Cenário: Navegação Bottom-Pill (Anti-Erro)
- **Given (Dado):** O painel é acessado num celular pequeno.
- **When (Quando):** O gerente rola a tela para ver a lista extensa de atendimentos pendentes.
- **Then (Então):** O menu de navegação inferior estilo pílula (flutuante) deve acompanhar a rolagem discretamente sobre a interface, garantindo que botões principais de retorno ou saída estejam acessíveis a 1 toque sem precisarem de "caça" por cabeçalhos estáticos.
