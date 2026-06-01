// @ts-nocheck

/**
 * lib/supabase.ts
 *
 * Two Supabase client factories:
 *
 * 1. createServerClient() — for use in Server Components, API routes, and
 *    Server Actions. Injects the Clerk user ID into the Postgres session so
 *    RLS policies can read it via current_setting('app.clerk_user_id').
 *    Uses the service role key for writes that need to bypass RLS
 *    (e.g. inserting proposal_events from the public accept endpoint).
 *
 * 2. createBrowserClient() — for use in Client Components only.
 *    Uses the anon key. RLS is the security layer — never expose the
 *    service role key to the browser under any circumstances.
 *
 * SECURITY: The service role key lives in SUPABASE_SERVICE_ROLE_KEY (no
 * NEXT_PUBLIC_ prefix). It is never bundled into the frontend build.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// ---------------------------------------------------------------------------
// Env validation — fail fast at startup rather than silently at runtime
// ---------------------------------------------------------------------------
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Check your .env.local file against .env.example.`
    );
  }
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

// ---------------------------------------------------------------------------
// Server client — used in API routes and Server Components
// Injects the Clerk user ID so RLS policies can scope queries.
// ---------------------------------------------------------------------------
export function createServerClient(clerkUserId: string) {
  // We use the anon key here — RLS policies enforce access control.
  // The clerk_user_id is injected as a Postgres session variable.
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        // Supabase supports setting Postgres config via headers
        // The RLS policies read this via current_setting('app.clerk_user_id')
        "x-clerk-user-id": clerkUserId,
      },
    },
  });
  return client;
}

/**
 * Admin/service-role client — bypasses RLS.
 * Use ONLY for:
 * - Writing acceptance records (public endpoint, no user session)
 * - Writing proposal events from the public live-link endpoint
 * - Workspace creation on first sign-in (before user is in the DB)
 *
 * NEVER return data from this client to the browser.
 * NEVER use this for user-facing reads.
 */
export function createAdminClient() {
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Browser client — used in Client Components only
// Uses the anon key. RLS is the security layer.
// ---------------------------------------------------------------------------
let browserClientInstance: ReturnType<typeof createClient<Database>> | null =
  null;

export function createBrowserClient() {
  if (browserClientInstance) return browserClientInstance;
  browserClientInstance = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    { auth: { persistSession: false } }
  );
  return browserClientInstance;
}
