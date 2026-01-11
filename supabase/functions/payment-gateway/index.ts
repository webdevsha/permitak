import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, ...data } = await req.json()
    
    // Configuration
    const apiKey = Deno.env.get('BILLPLZ_API_KEY')
    const collectionId = Deno.env.get('BILLPLZ_COLLECTION_ID')
    const isSandbox = Deno.env.get('BILLPLZ_SANDBOX') === 'true'
    
    const baseUrl = isSandbox 
      ? "https://www.billplz-sandbox.com/api/v3/bills" 
      : "https://www.billplz.com/api/v3/bills"

    console.log(`[payment-gateway] Environment: ${isSandbox ? 'SANDBOX' : 'PRODUCTION'}`)
    
    if (!apiKey || !collectionId) {
      throw new Error("Missing Billplz configuration")
    }

    // Billplz uses Basic Auth with API Key as username and empty password
    const authHeader = `Basic ${btoa(apiKey + ':')}`

    if (action === 'create_bill') {
      const { email, name, amount, description, redirect_url } = data

      // Amount in cents for Billplz
      const amountInCents = Math.round(parseFloat(amount) * 100)

      console.log(`[payment-gateway] Creating bill at ${baseUrl}`)

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collection_id: collectionId,
          email,
          name,
          amount: amountInCents,
          description,
          callback_url: redirect_url, 
          redirect_url: redirect_url
        })
      })

      const bill = await response.json()
      console.log("[payment-gateway] Response:", bill)

      if (bill.error) {
        // Pass the raw error from Billplz back to client
        console.error("[payment-gateway] Billplz Error:", bill.error)
        throw new Error(JSON.stringify(bill.error))
      }

      return new Response(JSON.stringify(bill), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })

    } else if (action === 'verify_bill') {
      const { bill_id } = data
      
      const response = await fetch(`${baseUrl}/${bill_id}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      })

      const bill = await response.json()
      
      if (bill.error) {
         console.error("[payment-gateway] Verify Error:", bill.error)
         throw new Error(JSON.stringify(bill.error))
      }

      return new Response(JSON.stringify({
        paid: bill.paid,
        state: bill.state,
        amount: bill.amount,
        id: bill.id
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    throw new Error("Invalid action")

  } catch (error) {
    console.error("[payment-gateway] Catch Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})