# Execution Plan: Supabase Migration

- [x] **Fase 1: Infraestrutura (VPS)**
  - [x] Clonar repositório docker do Supabase na VPS.
  - [x] Ajustar arquivo `.env` (API URLs, gerar JWT_SECRET, SENHAS nativas).
  - [x] Subir stack inicial (`docker compose up -d`).
  - [ ] Configurar Domínio + SSL via Reverse Proxy.

- [x] **Fase 2: Extração de Dados (Nuvem)**
  - [x] Rodar `pg_dump` completo (`-F c`) para os schemas: `public`, `auth`, `storage`.
  - [x] Exportar schema SQL plano para controle de versão (`--schema-only`).
  - [ ] Instalar/Configurar `rclone` com AWS keys da nuvem (Pendente credenciais do usuário).
  - [ ] Executar Sincronização S3 dos Buckets para repositório temporário local/VPS.

- [x] **Fase 3: Injeção de Dados (Self-Hosted)**
  - [x] Importar Database via `pg_restore` no pooler local.
  - [x] Validar contagens da tabela e usuários do Auth.
  - [ ] Injetar diretórios de binários no volume local de Storage do Docker (Pulado: Sem credenciais AWS S3).

- [ ] **Fase 4: Aplicações & Secrets**
  - [ ] Restaurar configurações de e-mail (GoTrue/SMTP).
  - [ ] Configurar Client Keys / Providers Oauth.
  - [ ] Deploy Edge Functions locais para o serviço Deno Self-Hosted.
  - [ ] Atualizar `.env` do Gerentesmec Frontend/Worker para o novo subdomínio/URL e keys do Self-Hosted.
