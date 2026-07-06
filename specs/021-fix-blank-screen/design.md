# Architecture Design: Dynamic Supabase Client

## O Problema
Atualmente, a Lovable gera o cliente com constantes chumbadas e hardcoded, o que faz a aplicação colapsar quando conectada ao projeto bloqueado ou migrado (`qtjitszradxsmnilnqtj` em read-only/paused state). 
O Vite tenta compilar e o erro de conexão assíncrono joga uma Exception fatal no nível mais alto do componente de contexto do React, resultando na White Screen (sem try/catch global).

## Solução Arquitetural
Alterar `src/integrations/supabase/client.ts` para captar suas variáveis diretamente das configurações Vite no `.env`.
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

E para que a Lovable consiga renderizar a tela visualmente sem tela branca no editor dela (que pode não ter o `.env` ou injetar localmente), implementaremos um fallback ou exigiremos do usuário plugar a Key nas configurações Secretas do construtor de lá.

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "http://100.114.251.99:8000";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhb..."; // a nova chave
```
