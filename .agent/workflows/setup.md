---
description: Configura o ambiente inicial do projeto para uso do Antigravity com as skills do ClawHub.
---

<!-- SETUP:START -->

**Objetivo**
Instalar as dependências e criar a infraestrutura necessária para o uso das skills do ClawHub (frontend, backend, nextjs, supabase e obsidian) no projeto atual. Além de garantir a configuração segura de credenciais do Github e do Supabase.

**Steps**

1. **Configuração do Github (Segura)**:
   - Peça ao usuário as informações (Email, Username e Token PAT) caso não estejam no ambiente.
   - Configure o repositório local com:
     - `git config user.name "USERNAME"`
     - `git config user.email "EMAIL"`
   - Defina o remote origin utilizando o token PAT de forma segura (apenas se for repositório privado ou CI): `git remote set-url origin https://USERNAME:TOKEN@github.com/USERNAME/REPO.git`.
   - Lembre o usuário de nunca enviar o token em texto puro para arquivos públicos.

2. **Configuração do Supabase**:
   - Verifique a existência de variáveis de ambiente (`SUPABASE_URL` e `SUPABASE_SERVICE_KEY`).
   - Caso não existam, instrua o usuário a criá-las ou injetá-las no `.env.local`. Garanta que o `.env.local` esteja no `.gitignore`.

3. **Verificação de CLI**:
   - Verifique se o `obsidian-cli` está instalado (necessário para a skill Obsidian). Se não, avise o usuário para instalá-lo.

4. **Scaffolding do Antigravity**:
   - Crie a pasta `.agent` na raiz do projeto atual.
   - Crie o arquivo inicial de memória em `.agent/memory.md` com as seções base de "Preferências de Arquitetura", "Erros Passados" e "Persona do Usuário".

5. **Validação**:
   - Garanta que a infraestrutura do projeto (ex: Next.js + Tailwind) está inicializada e funcional.
   - Emita uma mensagem de sucesso indicando que o ambiente está pronto para usar `/vibe-proposal`.

<!-- SETUP:END -->
