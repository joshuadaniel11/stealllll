import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const syncId = process.env.NEXT_PUBLIC_SUPABASE_SYNC_ID ?? "steal-shared-state";

  return {
    url,
    anonKey,
    syncId,
    configured: Boolean(url && anonKey),
  };
}

export function getSupabaseBrowserClient() {
  const config = getSupabaseConfig();
  if (!config.configured) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(config.url!, config.anonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return browserClient;
}
