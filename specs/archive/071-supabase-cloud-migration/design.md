# Design: Migração de Instância Supabase Cloud (071-supabase-cloud-migration)

## Arquitetura Técnica

```
[Vite Frontend / Lovable SPA] 
            │
            ▼ (HTTPS / WSS)
[Supabase Cloud Project: ijomsruroyeaapurnbqu.supabase.co]
   ├── Auth (JWT, Row Level Security)
   ├── PostgreSQL DB (Schemas, RPCs, Vector Ext)
   └── Storage Buckets (audits, inspections)
```

## Configuração de Ambiente & Interfaces

### Variáveis de Ambiente (`.env`)
```env
VITE_SUPABASE_URL="https://ijomsruroyeaapurnbqu.supabase.co"
VITE_SUPABASE_ANON_KEY="<SUPABASE_CLOUD_ANON_KEY>"
VITE_SUPABASE_SERVICE_ROLE_KEY="<SUPABASE_CLOUD_SERVICE_ROLE_KEY>"
```

### Cliente Supabase (`src/integrations/supabase/client.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ijomsruroyeaapurnbqu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "<SUPABASE_CLOUD_ANON_KEY>";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

## Componentes / Arquivos Impactados

1. `.env`: Atualização de `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_SUPABASE_SERVICE_ROLE_KEY`.
2. `src/integrations/supabase/client.ts`: Atualização das constantes de fallback para apontar para `https://ijomsruroyeaapurnbqu.supabase.co` e a nova anon key.
3. `supabase/config.toml` ou vinculação de projeto Supabase CLI: Apontamento para o project ref `ijomsruroyeaapurnbqu`.
4. Script de Migração Schema/Data (se necessário para a etapa de apply): Script utilitário em `scripts/apply_cloud_migration.mjs` para aplicar DDLs e seed de dados cadastrais.

## Topologia de Infraestrutura & Deploy
- **Projeto Supabase Cloud Target**: `ijomsruroyeaapurnbqu`
- **URL Base de API**: `https://ijomsruroyeaapurnbqu.supabase.co`
- **Modo Autenticação Supabase CLI**: Token via variável de ambiente `SUPABASE_ACCESS_TOKEN=<SUPABASE_ACCESS_TOKEN>` (Headless CLI Enforcement sem popups interativos).

## Cenários de Verificação (SCAN → INFER → VERIFY → FIX)

### Cenário 1: Conexão da Aplicação e Leitura de Dados
- **Estado Inicial**: Aplicação apontada para a nova URL Cloud `https://ijomsruroyeaapurnbqu.supabase.co`.
- **Ação**: Executar a aplicação e realizar uma requisição de leitura (ex: listar unidades ou carregar configurações).
- **Resultado Esperado**: Status HTTP 200/OK, sem erros de CORS, WSoD ou falha de JWT.

### Cenário 2: Envio de Inspeção PWA e Storage Upload
- **Estado Inicial**: Usuário abre o `/auditoria`, preenche um formulário e realiza o upload de uma evidência.
- **Ação**: Concluir o envio da vistoria.
- **Resultado Esperado**: O registro é inserido em `store_inspections` e a foto é gravada no bucket `audits` no projeto `ijomsruroyeaapurnbqu`.
