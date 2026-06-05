# Feature Proposal: Encoding & Mojibake Fix (010)

## 1. Requisitos
- **Correção Geral**: Identificar e corrigir caracteres corrompidos (`Ã`, `Â`, `â€`, etc.) em arquivos `.ts`, `.tsx` no frontend e `supabase/functions`.
- **Prevenção**: Criar um script Node (`scripts/check-encoding.mjs`) que varre os arquivos em busca de padrões quebrados e falha com código `1` caso encontre.
- **Integração no Build**: Adicionar o comando no `package.json` como script `prebuild`, impedindo a publicação com código corrompido.
- **Filtro de Exceções**: A varredura deve ser estrita para padrões de mojibake reais, evitando falsos positivos com acentuação válida do português (como `á`, `é`, `ç`).
- **Sanitização de Dados Externa**: Fornecer um utilitário para sanitizar possíveis textos quebrados oriundos do banco ou de webhooks.

## 2. User Stories
- **Como desenvolvedor**, quero que o build quebre imediatamente se um arquivo contendo caracteres corrompidos for comitado, para evitar deploys acidentais de páginas com "mojibake".
- **Como gerente da oficina**, quero acessar as páginas do Dashboard e TV e ver os textos "Evolução do Score Global", "Saúde", etc., escritos com acentuação perfeitamente correta.

## 3. Critérios de Aceite
- [ ] Arquivo `src/pages/Index.tsx` e `src/components/Dashboard/TvDashboard.tsx` perfeitamente ajustados.
- [ ] Script `scripts/check-encoding.mjs` criado e configurado para ignorar pastas como `node_modules` e `.git`.
- [ ] Script adicionado em `"prebuild"` dentro de `package.json`.
- [ ] Todas as instâncias ativas de caracteres corrompidos no runtime e Edge Functions foram removidas.

## 4. BDD Scenarios

### Cenário: Bloqueio de Build por Mojibake
- **Dado** que o desenvolvedor adicionou acidentalmente um arquivo com a string "ConfiguraÃ§Ã£o".
- **Quando** ele rodar `npm run build` ou subir o código para Vercel/Lovable.
- **Então** o script `prebuild` identificará a string "Ã§" e "Ã£", irá abortar a compilação com `process.exit(1)` e exibir a lista de arquivos ofensivos.

### Cenário: Exibição Correta na TV Executiva
- **Dado** que a TV do Executivo está online.
- **Quando** um gerente visualiza os gráficos e resumos.
- **Então** ele deve ler "Gráfico", "Últimos", e os símbolos "▼" e "▲" ao invés de códigos de bytes em UTF-8 duplos.
