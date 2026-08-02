// @ts-nocheck

/**
 * lib/env.ts
 *
 * Resolves the app's canonical base URL server-side. NEXT_PUBLIC_APP_URL is
 * an explicit manual override — an empty string counts as unset. Falls back
 * to Vercel's auto-injected system env vars so share links and emails are
 * correct on every deployment without manual configuration:
 * VERCEL_PROJECT_PRODUCTION_URL is the stable production domain;
 * VERCEL_URL is the current deployment's own domain (used outside
 * production so a preview's share links resolve on that preview, not on
 * the live site).
 */

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;

  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return "http://localhost:3000";
}
