# Spec Plan: Session Manager (Tempario)

## Phase 1: Ajuste Estrutural (Worker)
- [ ] Mudar inicialização do browser em `tempario-scraper.mjs` de `chromium.launch() + newContext({ storageState })` para `chromium.launchPersistentContext(userDataDir)`.
- [ ] Criar o diretório `data/browser_profile` para armazenamento persistente do perfil no servidor.
- [ ] Adicionar checagem de integridade (Pre-flight Check) na navegação: se a URL direcionar para `login`, abortar a execução e lançar `SESSION_EXPIRED`.

## Phase 2: Heartbeat Interno (Keep-alive Seguro)
- [ ] Remover o script isolado `auto-renew.mjs` (já que ele concorreria pelo acesso ao diretório do perfil do Chromium).
- [ ] Integrar um `setInterval` no arquivo `server.mjs` que coloque uma requisição de "Heartbeat" (`{ action: 'renew' }`) na própria fila de processamento (`queue`) a cada 1 hora.
- [ ] No scraper, tratar o `action: 'renew'`: navegar até a página principal logada, validar se ocorreu login, e retornar sucesso (sem tentar extrair dados de serviço).

## Phase 3: Geração de Sessão e Deploy
- [ ] Atualizar o script local `generate_session.mjs` para usar `launchPersistentContext` gravando na pasta local `data/browser_profile`.
- [ ] Modificar o script de deploy `deploy.mjs` para realizar upload zippado da pasta `data/browser_profile` (substituindo a necessidade de envio de apenas um `storageState.json`).
- [ ] Atualizar `ecosystem.config.cjs` para remover o processo `tempario-renew` do cronjob externo.
