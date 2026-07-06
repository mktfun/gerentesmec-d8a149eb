# Execution Plan: Conserto da Tela Branca

- [x] **Fase Única: Correção do Hardcode**
  - [x] Abrir `src/integrations/supabase/client.ts`.
  - [x] Remover as Strings de URL e API Key presas na nuvem expirada (id: `qtjitszradxsmnilnqtj`).
  - [x] Injetar as variáveis de ambiente `import.meta.env.VITE_SUPABASE_URL`.
  - [x] Inserir os falbacks diretos (IP da VPS e Key recém criada) via pipe lógico (`|| "fallback"`) no código, para forçar a plataforma Lovable a ler o self-hosted caso não tenhamos preenchido os secrets na UI deles.
