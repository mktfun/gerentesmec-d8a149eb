import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtjitszradxsmnilnqtj.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'mktfunil1@gmail.com',
    password: 'Mktfunil8563*',
    email_confirm: true
  });

  if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('User created successfully:', data.user.id);
  }
}

createUser();
