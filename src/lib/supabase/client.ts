import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      "Supabase URL and anon key must be set. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured as build environment variables."
    );
  }

  if (!client) {
    client = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  }
  return client;
}
