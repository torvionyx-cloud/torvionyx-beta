// @ts-nocheck

/**
 * lib/hash.ts
 *
 * Shared HMAC-SHA256 IP hashing. Server-side only.
 */

import { createHmac } from "crypto";

function getIpHashSecret(): string {
  const secret = process.env.IP_HASH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[hash] IP_HASH_SECRET is not set in production. Refusing to hash IPs with a predictable secret."
    );
  }

  console.warn("[hash] IP_HASH_SECRET not configured — using dev-only fallback secret.");
  return "fallback-dev-secret";
}

export function hashIp(ip: string): string {
  return createHmac("sha256", getIpHashSecret()).update(ip).digest("hex");
}
