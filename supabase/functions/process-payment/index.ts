import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
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
    const { agent_id, plan, amount } = await req.json();

    if (!agent_id || !plan) {
      return new Response(
        JSON.stringify({ error: "Missing billing parameters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Process payment via Stripe or Paystack (MOCKED)
    console.log(`Processing payment of ${amount} for plan ${plan}`);

    // 2. Update agent subscription tier securely
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const { data, error } = await supabase
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
