-- Create bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('audits', 'audits', true)
on conflict (id) do nothing;

-- Set up RLS for storage.objects
alter table storage.objects enable row level security;

-- Policy to allow authenticated users to insert
create policy "Autenticados podem fazer upload de evidências"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'audits' );

-- Policy to allow public to select
create policy "Leitura pública de evidências"
on storage.objects for select
to public
using ( bucket_id = 'audits' );

-- Policy to allow authenticated users to update
create policy "Auditores podem atualizar suas fotos"
on storage.objects for update
to authenticated
using ( bucket_id = 'audits' );
