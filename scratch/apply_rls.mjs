const projectRef = 'qtjitszradxsmnilnqtj';
const token = 'sbp_4c3bfd510dbb8c102b9c01cd4a38f2c7cfd96111';

const sql = `
insert into storage.buckets (id, name, public)
values ('audits', 'audits', true)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

-- Ignore error if policy exists
DO $$ 
BEGIN 
    BEGIN
        create policy "Autenticados_fazer_upload"
        on storage.objects for insert
        to authenticated
        with check ( bucket_id = 'audits' );
    EXCEPTION WHEN duplicate_object THEN
    END;
    
    BEGIN
        create policy "Leitura_publica"
        on storage.objects for select
        to public
        using ( bucket_id = 'audits' );
    EXCEPTION WHEN duplicate_object THEN
    END;

    BEGIN
        create policy "Auditores_atualizar"
        on storage.objects for update
        to authenticated
        using ( bucket_id = 'audits' );
    EXCEPTION WHEN duplicate_object THEN
    END;
END $$;
`;

async function run() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error('Error:', text);
  } else {
    console.log('Success:', await res.json());
  }
}

run();
