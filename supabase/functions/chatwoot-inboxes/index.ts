import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { chatwoot_url, chatwoot_token } = await req.json()

    if (!chatwoot_url || !chatwoot_token) {
      throw new Error('Missing URL or Token in payload')
    }

    const baseUrl = chatwoot_url.replace(/\/$/, '')
    const headers = { 'api_access_token': chatwoot_token }

    // 1. Fetch Profile
    const profileRes = await fetch(`${baseUrl}/api/v1/profile`, { headers })
    if (!profileRes.ok) throw new Error(`Failed to fetch Chatwoot profile: ${profileRes.statusText}`)
    const profileData = await profileRes.json()
    const accountId = profileData.account_id

    if (!accountId) throw new Error('Account ID not found in Chatwoot profile')

    // 2. Fetch Inboxes
    const inboxesRes = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/inboxes`, { headers })
    if (!inboxesRes.ok) throw new Error(`Failed to fetch inboxes: ${inboxesRes.statusText}`)
    const inboxesData = await inboxesRes.json()
    const inboxes = inboxesData.payload || []

    return new Response(JSON.stringify({ inboxes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Chatwoot Inboxes Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
