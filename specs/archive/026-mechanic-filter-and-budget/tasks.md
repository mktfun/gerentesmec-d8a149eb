# Tasks: Filtro de Mecânicas e Correção do Orçamento

- [x] 1. **Schema do Banco de Dados**
  - Criar migration `20260521_add_phone_to_units.sql` com: `ALTER TABLE public.units ADD COLUMN IF NOT EXISTS phone text;`
  - Aplicar a migration no banco local e remoto.
- [x] 2. **Edge Function `chatwoot-webhook`**
  - Adicionar checagem: `const { data: ignoreUnit } = await supabase.from('units').select('id').eq('phone', contactPhone).maybeSingle();`
  - Se `ignoreUnit` existir, abortar processamento e retornar sucesso (Ignorado).
  - Fazer deploy da Edge Function atualizada.
- [x] 3. **Frontend: Atualização Otimista do `updateLead`**
  - Editar `src/context/AppDataContext.tsx`.
  - Na função `updateLead`, adicionar a lógica de `setLeads(prev => prev.map(...))` **antes** do `supabase.update`.
  - Testar na UI modificando o orçamento de um lead e garantindo que o valor permaneça sem sumir e que o console acuse sucesso na atualização do Supabase.
