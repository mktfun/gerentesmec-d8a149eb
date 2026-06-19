import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qtjitszradxsmnilnqtj.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k';

const supabase = createClient(supabaseUrl, supabaseKey)

async function create() {
  const { data, error } = await supabase.storage.createBucket('audits', {
    public: true,
    fileSizeLimit: 20971520, // 20MB
    allowedMimeTypes: ['image/jpeg', 'image/png']
  });

  if (error) {
    if (error.message.includes('already exists')) {
       console.log('Bucket "audits" already exists. Ensuring it is public...');
       await supabase.storage.updateBucket('audits', { public: true });
    } else {
       console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Bucket "audits" created successfully!');
  }
}

create();
