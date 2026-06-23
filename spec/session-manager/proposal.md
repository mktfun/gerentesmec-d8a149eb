# Session Manager - Arquitetura Persistente (Tempario)

## 1. Problema Atual
O scraper (`tempario-scraper.mjs`) utiliza instâncias efêmeras do Chromium injetando um arquivo `storageState.json`. Quando a sessão no backend da Tempario ou os cookies do Cloudflare expiram (comprovado que ocorre em cerca de 3-4 horas), o scraper é redirecionado silenciosamente para a página de login, onde sofre um timeout esperando pelo seletor de "Tabela de Preços", resultando em `UI_INTERACTION_FAILED`. Além disso, o Cloudflare é mais agressivo contra contextos efêmeros.

## 2. Solução Proposta (Arquitetura)
Conforme análise estruturada, o sistema migrará de um contexto efêmero para um **Session Manager Persistente**:

1. **Perfil Fixado no Servidor (`launchPersistentContext`)**
   Em vez de carregar um JSON e criar um `newContext()` toda vez, o Playwright usará `chromium.launchPersistentContext(userDataDir)` reaproveitando 100% da identidade, cache local e impressões digitais (fingerprints) do navegador entre execuções. Isso reduz drasticamente a desconfiança do Cloudflare.

2. **Validação de Saúde da Sessão (Pre-flight Check)**
   Antes de buscar um serviço, o scraper verificará proativamente se a URL é a página de login ou se contém desafio de CAPTCHA ativo.
   - Se inválida, ele não entra em loop. Ele abortará imediatamente devolvendo o erro `SESSION_EXPIRED`.
   - O n8n receberá esse erro e enviará um alerta no WhatsApp: "O cookie venceu, preciso que você faça o login de manutenção!"

3. **Operação Semi-Assistida (Fallback)**
   O script de `generate_session.mjs` rodará localmente com interface gráfica aberta para que o usuário passe pela validação humana do Cloudflare. O deploy do novo diretório de dados (ou apenas reinício do worker caso use proxy/tunelamento) atualizará o servidor.

4. **Heartbeat Leve Agendado**
   O script `auto-renew.mjs` não precisa mais gerar `storageState.json`. Ele apenas roda em background usando o mesmo `userDataDir`, navega até uma rota interna, aguarda o site atualizar os tokens passivamente, e fecha o contexto. Rodará a cada 1 hora no PM2.

## 3. Limites e Contratos de Dados
- **Mutação de Estado**: O diretório `/home/servidor/tempario-worker/data/browser_profile` será a fonte de verdade dos cookies.
- **API (Retorno de Erro)**: 
  `{ "status": "session_error", "error": { "code": "SESSION_EXPIRED", "message": "A sessão expirou e foi redirecionada para o login." } }`

## 4. Análise Bayesiana de Risco
- **Risco 1**: Bloqueio de pasta. O PM2 com `auto-renew.mjs` não pode rodar enquanto `tempario-scraper.mjs` está rodando, pois o Playwright tranca (lock) o `userDataDir`. 
- **Mitigação**: O worker enfileira requisições. O `auto-renew` deve rodar via requisição no próprio express (ex: `POST /api/renew`) ou ser um processo do worker, em vez de um script independente acionado via cron externo.
- *Decisão Crítica*: O `auto-renew` será integrado ao `tempario-worker`. Um `setInterval` interno no servidor Express (rodando a cada 1 hora) fará a requisição de keep-alive usando a MESMA fila de processamento (`queue`), garantindo que não haja concorrência de acesso ao Chromium.
