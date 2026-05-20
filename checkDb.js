import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtjitszradxsmnilnqtj.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkDb() {
  const { data, error } = await supabase.from('units').select('*');
  if (error) {
    console.error('Error fetching units:', error);
  } else {
    console.log('Units:', data);
  }
}

checkDb();
