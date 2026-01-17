// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')!

    // 1. Verify User is Admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      throw new Error('Unauthorized: Admins only')
    }

    // 2. Fetch All Data (Tables)
    console.log('[system-backup] Fetching data...')
    const tables = ['profiles', 'tenants', 'locations', 'tenant_locations', 'transactions', 'tenant_payments']
    const backupData: Record<string, any> = {}

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*')
      if (error) throw error
      backupData[table] = data
    }

    // 3. Prepare File
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `backup-${timestamp}.json`
    const fileContent = JSON.stringify({
      created_at: new Date().toISOString(),
      creator_id: user.id,
      data: backupData
    }, null, 2)

    // 4. Upload to Storage
    console.log(`[system-backup] Uploading ${fileName}...`)
    const { error: uploadError } = await supabase.storage
      .from('backups')
      .upload(fileName, fileContent, {
        contentType: 'application/json',
        upsert: false
      })

    if (uploadError) throw uploadError

    return new Response(JSON.stringify({ success: true, fileName }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[system-backup] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
