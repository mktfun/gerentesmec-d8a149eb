import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchLeadsForAudit() {
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .or("score.is.null,score.eq.0")
    .limit(5);

  if (error) {
    console.error("Error fetching leads:", error);
    process.exit(1);
  }

  const results = [];

  for (const lead of leads) {
    const { data: messages, error: msgError } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: true });

    results.push({
      lead,
      messages: msgError ? [] : messages
    });
  }

  fs.writeFileSync("audit_data.json", JSON.stringify(results, null, 2));
  console.log("Data saved to audit_data.json");
}

fetchLeadsForAudit();
