/**
 * lib/anthropic.ts
 *
 * Anthropic SDK client — SERVER-SIDE ONLY.
 *
 * This file must never be imported in Client Components or anything that
 * could end up in the browser bundle. The API key is a server-only env var
 * (no NEXT_PUBLIC_ prefix). If this file is accidentally imported client-side,
 * the requireEnv call will throw at build time.
 *
 * Usage: import { anthropic } from "@/lib/anthropic" in API routes only.
 */

import Anthropic from "@anthropic-ai/sdk";

function requireServerEnv(key: string): string {
  if (typeof window !== "undefined") {
    throw new Error(
      `[Security] Attempted to access server env var "${key}" on the client. ` +
        `This file must only be used in server-side code.`
    );
  }
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required server environment variable: ${key}`);
  }
  return value;
}

// Singleton — reuse across requests in the same server instance
let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: requireServerEnv("ANTHROPIC_API_KEY"),
    });
  }
  return _client;
}

// Convenience export for direct use in route handlers
export const anthropic = getAnthropicClient;

// The model to use for proposal generation
// Always use a specific version string — never "latest"
export const GENERATION_MODEL = "claude-sonnet-4-6";

// Hard limits — enforced before any API call
export const GENERATION_LIMITS = {
  // Maximum characters in the user's brief (prevent prompt injection via huge inputs)
  MAX_BRIEF_CHARS: 4000,
  // Maximum tokens the model may output
  MAX_OUTPUT_TOKENS: 4000,
  // Retry count on malformed JSON output before falling back
  JSON_REPAIR_RETRIES: 1,
} as const;
