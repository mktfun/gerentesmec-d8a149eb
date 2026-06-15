const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(JSON.stringify({ error: "Missing Supabase credentials in .env" }));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: tasks, error } = await supabase
    .from('ai_task_queue')
    .select('*')
    .in('status', ['pending', 'error'])
    .limit(5); // Fetch 5 at a time

  if (error) {
    console.error(JSON.stringify({ error: "Error fetching tasks", details: error }));
    return;
  }

  if (!tasks || tasks.length === 0) {
    console.log(JSON.stringify({ tasks: [] }));
    return;
  }

  const result = [];
  for (const task of tasks) {
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('lead_id', task.lead_id)
      // .eq('ai_audited', false) // Not filtering ai_audited here to have context, or I should?
      // I should read the whole conversation for context, but mark ai_audited on those that aren't
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error(JSON.stringify({ error: `Error fetching messages for lead ${task.lead_id}`, details: msgError }));
      continue;
    }

    result.push({
      task,
      messages: messages || []
    });
  }

  console.log(JSON.stringify({ tasks: result }));
}

main().catch(e => console.error(JSON.stringify({ error: e.message })));
