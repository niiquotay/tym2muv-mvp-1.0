import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify User Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized request" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { reference, listingId } = await req.json();

    if (!reference || !listingId) {
      return new Response(
        JSON.stringify({ error: "Missing payment parameters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check Idempotency
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('reference_id', reference)
      .maybeSingle();

    if (existingPayment) {
      return new Response(
        JSON.stringify({ error: "Payment already processed", success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verify Payment via Paystack
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      throw new Error("Missing Paystack secret key");
    }

    const verifyReq = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`
      }
    });

    const verifyData = await verifyReq.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return new Response(
        JSON.stringify({ error: "Payment failed verification", success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Update the listing to isPremium = true
    const { error: listingError } = await supabaseAdmin
      .from('properties')
      .update({ is_premium: true })
      .eq('id', listingId);

    if (listingError) throw listingError;

    // 5. Insert payment record
    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        amount: verifyData.data.amount / 100, // Paystack amount is in pesewas/kobo
        currency: verifyData.data.currency,
        status: 'completed',
        purpose: 'listing_fee',
        reference_id: reference,
        gateway: 'Paystack'
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Payment processing failed", details: err.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
