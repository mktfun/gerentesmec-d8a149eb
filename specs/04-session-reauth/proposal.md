# Proposal: Fluxo de Reautenticação Assistida (Heartbeat & Magic Link)

## 1. Visão Geral
Sessões do Tempario expiram periodicamente. Atualmente, a recuperação exige intervenção manual copiando cookies. O objetivo é automatizar esse processo através de um **Heartbeat** que monitora a validade da sessão e um fluxo de **Magic Link** acionado via WhatsApp (via n8n) para que o usuário possa reautenticar facilmente sem manipular JSONs de cookies.

## 2. A Arquitetura Proposta

O fluxo sugerido envolve os seguintes componentes:

1. **Heartbeat Cron (`session-heartbeat.mjs`)**
   - Roda a cada X minutos no PM2.
   - Acessa uma rota protegida do Tempario. Se for redirecionado para o login, dispara um Webhook para o n8n informando `session_expired`.
2. **Notificação (n8n)**
   - Recebe o webhook e envia uma mensagem no WhatsApp com um **Magic Link** exclusivo, gerado pela nossa API, válido por tempo limitado.
3. **Gateway de Autenticação (`reauth-ui`)**
   - O usuário abre o link no celular ou PC.
   - **Desafio Técnico Central**: Como o usuário resolverá o CAPTCHA do Tempario através do nosso link, garantindo que os cookies gerados sejam capturados e salvos no servidor Linux (Worker)?

## Open Questions
> [!IMPORTANT]
> A sua ideia conceitual de clicar num link e renovar a sessão é perfeita em termos de produto. No entanto, tecnicamente, o worker roda em um servidor **Linux (Headless)**. Quando o usuário abrir o link no celular (WhatsApp), como ele vai interagir com a tela do Tempario para resolver o CAPTCHA e fazer o login?
> 
> **Opção A (A mais simples e 100% funcional):** O link enviado para o celular abre uma página nossa onde você digita seu E-mail e Senha. O servidor Linux tenta fazer o login. *Problema: O Tempario possui CAPTCHA da Cloudflare/Google, o que barraria o login invisível no servidor.*
> 
> **Opção B (App Local no PC):** Em vez de resolver pelo celular, o n8n te avisa no WhatsApp: "Sessão expirou". Você vai no seu computador (onde a IA roda), clica num atalho na Área de Trabalho chamado `Renovar Tempario`. Ele abre um Chrome visível, você loga, resolve o captcha, e o script envia os cookies novos automaticamente para o servidor PM2.
> 
> **Opção C (Reverse Proxy / Phishing-like):** Nós subimos um Proxy Reverso (ex: `https://seu-ip/login-tempario`) que espelha a página real do Tempario pro seu celular. Você loga por lá, o proxy intercepta os cookies gerados e salva no servidor. É a experiência exata de um "Magic Link", mas dá um pouco mais de trabalho para contornar bloqueios de CORS e X-Frame-Options do Tempario.
> 
> **Opção D (Screencast no Browser):** O magic link abre uma página HTML no seu celular que transmite a tela do servidor Linux via WebSocket (como um acesso remoto/AnyDesk pelo navegador). Você vê a tela do robô e clica no Captcha.
> 
> Qual abordagem você prefere seguir para que eu possa planejar a arquitetura técnica exata do Magic Link?
