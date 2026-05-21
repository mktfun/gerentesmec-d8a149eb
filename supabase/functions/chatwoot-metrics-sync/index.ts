import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch integration settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from("integration_settings")
      .select("*")
      .single();

    if (settingsError || !settings || !settings.chatwoot_url || !settings.api_access_token) {
      throw new Error("Chatwoot integration not configured");
    }

    const { chatwoot_url, api_access_token, chatwoot_account_id } = settings;
    const accountId = chatwoot_account_id || 1;
    
    // Normalize URL
    const baseUrl = chatwoot_url.startsWith('http') ? chatwoot_url : `https://${chatwoot_url}`;
    const headers = {
      "api_access_token": api_access_token,
      "Content-Type": "application/json"
    };

    // --- STEP 1: Sync Global Reports ---
    // Fetch last 7 days summary
    const until = Math.floor(Date.now() / 1000);
    const since = until - (7 * 24 * 60 * 60);

    const reportRes = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/reports/summary?since=${since}&until=${until}&type=account`, {
      headers
    });

    if (reportRes.ok) {
      const reportData = await reportRes.json();
      
      // Upsert into chatwoot_insights
      await supabaseClient
        .from("chatwoot_insights")
        .upsert({
          type: "account",
          entity_id: accountId.toString(),
          metrics: reportData,
          updated_at: new Date().toISOString()
        }, { onConflict: "type,entity_id" });
        
      console.log("Reports synced successfully");
    } else {
      console.error("Failed to fetch reports:", await reportRes.text());
    }

    // --- STEP 2: Sync Conversations Waiting Time ---
    // We only care about open conversations that might have waiting_since
    const convRes = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/conversations?status=open`, {
      headers
    });

    if (convRes.ok) {
      const convData = await convRes.json();
      const conversations = convData.data.payload || [];

      console.log(`Found ${conversations.length} open conversations to sync`);

      for (const conv of conversations) {
        // If waiting_since is 0 or null, it means no wait time.
        // snoozed_until is also a timestamp if the conversation is snoozed.
        const waitingSince = conv.waiting_since ? new Date(conv.waiting_since * 1000).toISOString() : null;
        const snoozedUntil = conv.snoozed_until ? new Date(conv.snoozed_until * 1000).toISOString() : null;

        // Update the lead corresponding to this conversation
        await supabaseClient
          .from("leads")
          .update({
            chatwoot_waiting_since: waitingSince,
            chatwoot_snoozed_until: snoozedUntil,
          })
          .eq("chatwoot_conversation_id", conv.id.toString());
      }
      console.log("Conversations wait times synced successfully");
    } else {
      console.error("Failed to fetch conversations:", await convRes.text());
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
