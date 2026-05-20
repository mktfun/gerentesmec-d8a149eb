## Diagnóstico

Todas as telas estão brancas porque `src/integrations/supabase/client.ts` lança um erro em tempo de execução:

```ts
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables');
}
```

O Vite só injeta `import.meta.env.VITE_*` a partir de um arquivo `.env` na raiz do projeto. Verificações feitas:

- `/dev-server/.env` **não existe** (`ls` retorna "No such file").
- As variáveis (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`/`PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) existem no ambiente do sandbox, mas o Vite não as lê do shell — precisa do arquivo.
- O Supabase do projeto `gerentesmec` está conectado e as tabelas (`leads`, `managers`, `units`, `ai_settings`) já existem.
- Logs do Vite mostram build OK, sem erro de TypeScript real — o "erro de build" percebido é o throw em runtime que quebra o React no boot.

Resumindo: não há bug de TypeScript nem de build; é só `.env` faltando.

## Plano de correção

1. **Criar `/dev-server/.env`** com as variáveis que o `client.ts` espera:
   ```
   VITE_SUPABASE_URL=<url do projeto>
   VITE_SUPABASE_ANON_KEY=<publishable key>
   VITE_SUPABASE_PROJECT_ID=<project id>
   ```
   Valores vêm das envs já presentes no sandbox (`VITE_SUPABASE_*`).

2. **Atualizar `.gitignore`** removendo a entrada que ignora `.env` (se houver) — atualmente o `.gitignore` não lista `.env` explicitamente, então provavelmente nenhuma mudança é necessária aqui; confirmar durante a aplicação.

3. **Reiniciar o dev server** para o Vite reler o `.env` e injetar as variáveis no `import.meta.env`.

4. **Validar**: abrir `/`, `/crm`, `/gerentes`, `/config`, `/relatorios` — todas devem renderizar normalmente, sem mais tela branca.

Nenhuma alteração de código-fonte React/TS é necessária.