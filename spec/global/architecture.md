# Architecture Specification (GerentesMec)

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Shadcn UI / Lucide Icons.
- **Backend / BaaS**: Supabase (PostgreSQL, RLS, Storage Buckets, Edge Functions, Auth).
- **Integrations**: Chatwoot (WhatsApp), Playwright Worker (Tempario), n8n webhooks.

## Estrutura de Pastas
- `src/components/`: Componentes UI reutilizáveis e páginas de aplicação.
- `src/integrations/supabase/`: Cliente tipado Supabase e definições de schema (`client.ts`, `types.ts`).
- `supabase/migrations/`: Scripts DDL/DML versionados.
- `supabase/functions/`: Supabase Edge Functions.
- `specs/`: Especificações físicas SDD (`proposal.md`, `design.md`, `spec-plan.md`).

## Subdomínios & Topologia
- **Frontend App**: SPA Vite / Lovable.
- **Backend Cloud**: Supabase Cloud (`https://ijomsruroyeaapurnbqu.supabase.co`).
