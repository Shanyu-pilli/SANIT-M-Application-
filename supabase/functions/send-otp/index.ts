// Supabase serverless function removed.
// The project has migrated away from Supabase functions. This stub returns
// a 410 Gone response to ensure callers fail fast and the repository no
// longer relies on Supabase internals here.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const handler = async (_req: Request): Promise<Response> => {
  return new Response(JSON.stringify({ error: "Supabase function removed" }), {
    status: 410,
    headers: { "Content-Type": "application/json" },
  });
};

serve(handler);
