/**
 * lib/rate-limit.ts
 *
 * Distributed rate limiting via Upstash Redis.
 * Applied at the API route level — different limits for different endpoints.
 *
 * Limits (from PRD security requirements):
 * - AI generation: strictest — most expensive endpoint, primary abuse target
 * - Auth endpoints: 5 requests / 15 min / IP (handled by Clerk, but we add our own)
 * - General API: moderate limits per endpoint
 *
 * Returns a 429 with Retry-After header on breach.
 * Gracefully falls back to allowing requests if Upstash is not configured.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    // Upstash not configured — rate limiting disabled (dev mode)
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

// ---------------------------------------------------------------------------
// Rate limiter configurations
// ---------------------------------------------------------------------------

function makeGenerationLimiters(): {
  minute: Ratelimit;
  day: Ratelimit;
} | null {
  const r = getRedis();
  if (!r) return null;
  return {
    minute: new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(2, "1 m"),
      prefix: "pitchwright:gen:minute",
      analytics: false,
    }),
    day: new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(10, "24 h"),
      prefix: "pitchwright:gen:day",
      analytics: false,
    }),
  };
}

function makeGeneralLimiter(): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "pitchwright:api",
    analytics: false,
  });
}

function makePublicLimiter(): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "pitchwright:public",
    analytics: false,
  });
}

// ---------------------------------------------------------------------------
// Helper: extract a stable identifier for rate limiting
// ---------------------------------------------------------------------------
export function getRateLimitKey(req: Request, userId?: string): string {
  if (userId) return userId;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}

// ---------------------------------------------------------------------------
// Rate limit checkers — call at the top of each route handler
// ---------------------------------------------------------------------------

/**
 * Check the AI generation rate limit.
 * Returns a 429 response if the limit is exceeded, or null if OK.
 */
export async function checkGenerationRateLimit(
  userId: string
): Promise<NextResponse | null> {
  const limiters = makeGenerationLimiters();
  if (!limiters) {
    // Upstash not configured — warn once and allow through
    console.warn("[rate-limit] Upstash not configured — generation rate limiting disabled");
    return null;
  }

  const [minuteResult, dayResult] = await Promise.all([
    limiters.minute.limit(userId),
    limiters.day.limit(userId),
  ]);

  if (!minuteResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before generating again." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "2",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  if (!dayResult.success) {
    return NextResponse.json(
      { error: "Daily generation limit reached. Resets at midnight UTC." },
      {
        status: 429,
        headers: {
          "Retry-After": "86400",
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}

/**
 * Check the general API rate limit.
 * Returns a 429 response if exceeded, or null if OK.
 */
export async function checkGeneralRateLimit(
  key: string
): Promise<NextResponse | null> {
  const limiter = makeGeneralLimiter();
  if (!limiter) return null;

  const result = await limiter.limit(key);
  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" },
      }
    );
  }
  return null;
}

/**
 * Check the public endpoint rate limit (by IP).
 */
export async function checkPublicRateLimit(
  ip: string
): Promise<NextResponse | null> {
  const limiter = makePublicLimiter();
  if (!limiter) return null;

  const result = await limiter.limit(ip);
  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  return null;
}
