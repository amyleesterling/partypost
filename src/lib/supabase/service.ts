import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS. Use only in trusted server code:
// guest RSVP edits via token, image uploads, anything that needs to read
// across hosts (export, etc.). NEVER import this from client components.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
