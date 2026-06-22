# Spec Plan (Checklist): Integração Tempario

- [x] **1. Setup da Infraestrutura Worker**
  - Inicializar projeto Node.js na subpasta (ex: `worker/` ou `tempario-worker/`) via `npm init -y`.
  - Instalar dependências básicas: `playwright`, `express`, `zod` (para validação de schemas).
  - Configurar `.env.example` no worker contendo as portas padrão e paths de arquivos (ex: `PORT=3000`).

- [x] **2. Gerenciador de Sessão (`session-manager.js`)**
  - Implementar função de verificação do arquivo `storageState.json`.
  - Caso não exista, garantir que ele retorna o erro `SESSION_EXPIRED` padronizado.
  - Opcional/Utilitário: script auxiliar simples (ex: `login-manual.js`) que abra um navegador em modo headful e, ao finalizar login manualmente pelo usuário, gere o `storageState.json` automaticamente para facilitar a vida do operador.

- [x] **3. Navegador e Extrator UI (`tempario-scraper.js`)**
  - Instanciar `chromium.launch` e `context` com o arquivo de estado.
  - Navegar para a página inicial/busca do Tempario.
  - Detectar estado de erro de sessão da UI (ex: presença da tela de login).
  - Implementar preenchimento condicional: Busca por Placa.
  - Implementar preenchimento condicional: Busca por Marca/Modelo.
  - Implementar busca de Serviço e captura do texto/tabela de resultados.
  - Criar lógicas para gerar screenshots em falhas e persistir na pasta `data/errors/`.

- [x] **4. API Express Server (`server.js`)**
  - Configurar endpoint `POST /api/query`.
  - Validar request payload com `zod`.
  - Realizar chamada sequencial (lock local ou fila na memória simples) para não abrir abas massivamente, mantendo baixa concorrência.
  - Responder no formato JSON de contrato, contendo tempo e metadados.

- [x] **5. Módulo N8N (Design Orientativo)**
  - Documentar ou gerar o JSON base de workflow para o usuário importar (N8N suporta importação via arquivo `.json` de fluxo).
  - O fluxo base deve conter: Webhook -> Validador -> Requisição HTTP ao Worker -> Switch final de status.

- [x] **6. Verificação de Cenários**
  - Script interno de teste de fumaça (envia JSON simulado ao próprio worker para ver se os fluxos rodam até o final e disparam erro correto).
