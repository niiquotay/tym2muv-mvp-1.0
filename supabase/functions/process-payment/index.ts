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

    const { agent_id, plan, amount } = await req.json();

    if (!agent_id || !plan) {
      return new Response(
        JSON.stringify({ error: "Missing billing parameters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Security Check: Only the authenticated user can upgrade their own agent account
    // Or if the user is a super admin
    if (user.id !== agent_id && user.user_metadata?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Forbidden: Cannot alter another user's subscription" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Process payment via Stripe or Paystack (MOCKED)
    console.log(`Processing payment of ${amount} for plan ${plan}`);

    // 3. Update agent subscription tier securely bypassing RLS (since we already authorized)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const { data, error } = await supabaseAdmin
      .from('agents')
      .update({
        subscription_plan: plan,
        subscription_expiry: expiryDate.toISOString(),
      })
      .eq('id', agent_id)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Payment processing failed", details: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
