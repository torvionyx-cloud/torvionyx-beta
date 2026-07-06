// @ts-nocheck

/**
 * lib/supabase.ts
 *
 * Three Supabase client factories:
 *
 * 1. createServerClient() — for use in Server Components, API routes, and
 *    Server Actions where a user is signed in. Passes the caller's Clerk
 *    session JWT to Supabase, which validates it against the registered
 *    Clerk issuer and exposes the Clerk user ID to RLS via auth.jwt()->>'sub'.
 *    Uses the anon key: Row-Level Security is the enforcement layer.
 *
 * 2. createAdminClient() — service-role client that BYPASSES RLS. Use ONLY
 *    for genuinely session-less server work (public accept/view endpoints,
 *    workspace bootstrap on first sign-in). Never for user-facing reads.
 *
 * 3. createBrowserClient() — for Client Components only. Anon key. RLS is
 *    the security layer — the service role key is never exposed to the browser.
 *
 * SECURITY: The service role key lives in SUPABASE_SERVICE_ROLE_KEY (no
 * NEXT_PUBLIC_ prefix). It is never bundled into the frontend build.
 */

import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
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
// Server client — used in API routes and Server Components for signed-in users.
// Passes the Clerk session JWT to Supabase so RLS policies can scope queries
// via auth.jwt()->>'sub'. Uses the anon key; RLS enforces access control.
// ---------------------------------------------------------------------------
export function createServerClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    async accessToken() {
      // Clerk's current session token; null when there is no active session.
      return (await auth()).getToken();
    },
  });
}

/**
 * Admin/service-role client — bypasses RLS.
 * Use ONLY for:
 * - Writing acceptance records (public endpoint, no user session)
 * - Writing proposal events from the public live-link endpoint
 * - Reading/rendering the public proposal page, scoped by share_token
 * - Workspace creation on first sign-in (before user is in the DB)
 *
 * NEVER return data from this client to the browser.
 * NEVER use this for authenticated user-facing reads — use createServerClient().
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
  if (browserClientI