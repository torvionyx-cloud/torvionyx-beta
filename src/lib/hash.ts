// @ts-nocheck

/**
 * lib/hash.ts
 *
 * Shared HMAC-SHA256 IP hashing. Server-side only.
 */

export function hashIp(ip: string): string {
  const { createHmac } = require("crypto");
  return createHmac("sha256", process.env.IP_HASH_SECRET ?? "fallback-dev-secret")
    .update(ip)
    .digest("hex");
}
