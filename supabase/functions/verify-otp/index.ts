// @ts-nocheck
/* eslint-disable */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// Supabase function removed — stubbed to 410 Gone.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  otpCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otpCode }: VerifyOTPRequest = await req.json();

    if (!email || !otpCode) {
      throw new Error("Email and OTP code are required");
    }

  // This function has been removed during the Supabase migration. Return
  // 410 to indicate the endpoint is gone. If you need OTP functionality,
  // implement a server endpoint under `server/` and update the frontend to
  // call that API instead.
  return new Response(JSON.stringify({ error: 'Supabase function removed' }), { status: 410, headers: corsHeaders });
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
