import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // We need admin privileges to create users directly
    )

    // Check if the user calling this is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Auth Header')
    
    // Verify token using the service role client
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      throw new Error('Forbidden: Only admins can create users')
    }

    let { action, email, password, manager_id, auth_user_id } = await req.json()
    if (!action) action = 'create'

    if (action === 'create') {
      if (!email || !password || !manager_id) throw new Error('Missing required fields for create')
      
      if (!email.includes('@')) email = `${email.trim()}@gerentes.com`

      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email, password, email_confirm: true,
      })
      if (createError) throw createError

      const { error: updateError } = await supabaseClient
        .from('managers')
        .update({ auth_user_id: newUser.user.id })
        .eq('id', manager_id)
      if (updateError) throw updateError

      return new Response(JSON.stringify({ success: true, user: newUser.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } 
    
    if (action === 'update') {
      if (!auth_user_id) throw new Error('Missing auth_user_id for update')
      const updates: any = {}
      if (email) {
        if (!email.includes('@')) email = `${email.trim()}@gerentes.com`
        updates.email = email
      }
      if (password) updates.password = password

      const { data: updatedUser, error: updateError } = await supabaseClient.auth.admin.updateUserById(auth_user_id, updates)
      if (updateError) throw updateError

      return new Response(JSON.stringify({ success: true, user: updatedUser.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'revoke') {
      if (!auth_user_id || !manager_id) throw new Error('Missing fields for revoke')
      
      // Delete user from auth
      const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(auth_user_id)
      if (deleteError) throw deleteError

      // Remove link from manager
      const { error: updateError } = await supabaseClient
        .from('managers')
        .update({ auth_user_id: null })
        .eq('id', manager_id)
      if (updateError) throw updateError

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Invalid action')

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
