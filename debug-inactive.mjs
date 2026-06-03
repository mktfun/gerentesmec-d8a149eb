import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkInactivity() {
  const { data: managers } = await supabase.from('managers').select('*');
  const { data: units } = await supabase.from('units').select('*');
  const { data: leads } = await supabase.from('leads').select('*');

  const now = Date.now();
  console.log("Current Time:", new Date(now).toISOString());

  const managerRanking = managers.map(m => {
    const unit = units.find(u => u.id === m.unit_id);
    const mLeadsAll = leads.filter(l => l.manager_id === m.id || (!l.manager_id && l.unit_id === m.unit_id));
    
    const lastActiveAt = mLeadsAll.reduce((max, l) => {
      const time = new Date(l.last_message_at).getTime();
      return time > max ? time : max;
    }, 0);
    
    const isInactive = lastActiveAt > 0 && (now - lastActiveAt) > 24 * 60 * 60 * 1000;

    return { 
      name: m.name, 
      unit: unit?.name,
      leadsCount: mLeadsAll.length,
      lastActiveAtISO: lastActiveAt > 0 ? new Date(lastActiveAt).toISOString() : 'N/A',
      hoursSinceLastActive: lastActiveAt > 0 ? ((now - lastActiveAt) / (1000 * 60 * 60)).toFixed(1) : 'N/A',
      isInactive 
    };
  });

  console.table(managerRanking);
}

checkInactivity();
