const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const taskId = process.argv[2];
const leadId = process.argv[3];
const updateDataStr = process.argv[4];

async function main() {
  try {
    const updateData = JSON.parse(updateDataStr);
    
    // 1. Update lead
    const { error: leadError } = await supabase
      .from('leads')
      .update({
        audit_checklist: updateData.checklist,
        score: updateData.score,
        funnel_stage: updateData.funnel_stage
      })
      .eq('id', leadId);

    if (leadError) throw leadError;

    // 2. Update chat messages
    const { error: msgError } = await supabase
      .from('chat_messages')
      .update({ ai_audited: true })
      .eq('lead_id', leadId)
      .eq('ai_audited', false);
      
    if (msgError) throw msgError;

    // 3. Update task queue
    const { error: taskError } = await supabase
      .from('ai_task_queue')
      .update({ status: 'success' })
      .eq('id', taskId);

    if (taskError) throw taskError;

    console.log(JSON.stringify({ success: true, taskId, leadId }));
  } catch (e) {
    console.error(JSON.stringify({ success: false, error: e.message, details: e }));
  }
}

main();
