import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkQueue() {
  const { data, error, count } = await supabase
    .from('ai_task_queue')
    .select('*', { count: 'exact' })
    .in('status', ['pending', 'error']);

  if (error) {
    console.error('Error fetching queue:', error);
    return;
  }

  console.log(`Total tasks to process: ${count}`);
  console.log('Sample tasks:', data.slice(0, 5));
}

checkQueue();
