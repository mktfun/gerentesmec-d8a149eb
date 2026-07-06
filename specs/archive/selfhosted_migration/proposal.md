# Supabase Cloud to Self-Hosted Migration

## Overview
A instância na nuvem do Supabase entrará em modo Read-Only no dia 23 de julho. Este projeto tem o objetivo de realizar uma migração Zero-Downtime para um ambiente VPS Self-Hosted orquestrado via Docker Compose.

## Scope & Boundaries
- **Database Dump**: Extração de dados via `pg_dump` com a flag `-F c` ou `.sql` format para os schemas críticos (`public`, `auth`, `storage`, e eventuais extensões como vetores).
- **Storage Sync**: Sincronização dos binários dos Buckets usando o `rclone` (S3-compatible) a partir de um script/agendador dentro de um contêiner Python ou Bash.
- **Edge Functions**: Sincronização e deploy dos códigos-fonte das funções existentes para o serviço local Deno/Edge Functions do Supabase Self-Hosted.
- **Auth Configs**: Reconfiguração manual de RLS, templates de email, providers, que ficam fora do dump padrão.
- **Reverse Proxy**: Redirecionamento HTTPS via domínio/subdomínio configurado com Traefik, Caddy ou Nginx (e.g., `supabase.tork.services`).

## Risks & Edge Cases
- Conflitos de UUIDs de Storage com referências do banco de dados (o banco mapeia, mas os binários não existem se o rclone falhar).
- Secrets faltantes nas Edge Functions (variáveis de ambiente locais precisam ser replicadas).
- Quedas de DNS durante a virada do tráfego.

## Constraints
- Ambiente em VPS via Docker Compose (oficial).
- Necessidade de agendamento automatizado das sincronizações ANTES de 23/Jul.
- Validar se Extensões (ex. pg_vector, pg_cron) estão presentes/compiladas no Docker do self-hosted.
