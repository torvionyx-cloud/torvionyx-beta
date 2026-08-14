// @ts-nocheck

/**
 * lib/rate-limit.ts
 *
 * Distributed rate limiting via Upstash Redis.
 * Applied at the API route level — different limits for different endpoints.
 *
 * Limits (from PRD security requirements):
 * - AI generation: strictest — most expensive endpoint, primary abuse target
 * - AI scoring: more generous than generation (cheaper, runs more often), but
 *   on its own bucket so it never eats into the generation budget
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
      prefix: "torvionyx:gen:minute",
      analytics: false,
    }),
    day: new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(10, "24 h"),
      prefix: "torvionyx:gen:day",
      analytics: false,
    }),
  };
}

function makeScoringLimiter(): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "torvionyx:score:minute",
    analytics: false,
  });
}

function makeWorkspaceGenerationLimiter(): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    prefix: "torvionyx:gen:workspace:hour",
    analytics: false,
  });
}

function makeGeneralLimiter(): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "torvionyx:api",
    analytics: false,
  });
}

function makePublicLimiter(): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "torvionyx:public",
    analytics: false,
  });
}

// ---------------------------------------------------------------------------
// Helper: extract a stable identifier for rate limiting
// ---------------------------------------------------------------------------
export function getRateLimitKey(req: Request, userId?: string): string {
  if (userId) return userId;
  // x-real-ip is set by Vercel's own proxy and can't be spoofed by the
  // client the way an arbitrary x-forwarded-for entry can — prefer it when
  // present, fall back to x-forwarded-for otherwise.
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
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
    // Upstash not configured. In production, the most expensive/abuse-prone
    // endpoint in the app must never run unlimited — fail closed rather than
    // silently allowing every request through. In dev, allow through so
    // local work isn't blocked on having Upstash configured.
    if (process.env.NODE_ENV === "production") {
      console.error("[rate-limit] Upstash not configured in production — failing closed on generation endpoint");
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }
    console.warn("[rate-limit] Upstash not configured — generation rate limiting disabled (dev mode)");
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
 * Check the AI scoring rate limit (20 requests / minute / user).
 * Scoring is an AI endpoint, but cheaper and more frequent than generation
 * (a user may re-score after each rewrite), so it gets its own, more
 * generous bucket that never consumes the generation budget.
 * Returns a 429 response if exceeded, or null if OK.
 */
export async function checkScoringRateLimit(
  userId: string
): Promise<NextResponse | null> {
  const limiter = makeScoringLimiter();
  if (!limiter) {
    // Same fail-closed reasoning as checkGenerationRateLimit — scoring is
    // still an AI-call endpoint, so production must not run it unlimited
    // just because Upstash isn't configured.
    if (process.env.NODE_ENV === "production") {
      console.error("[rate-limit] Upstash not configured in production — failing closed on scoring endpoint");
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }
    console.warn("[rate-limit] Upstash not configured — scoring rate limiting disabled (dev mode)");
    return null;
  }

  const result = await limiter.limit(userId);
  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before scoring again." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "20",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }
  return null;
}

/**
 * Check the per-workspace AI generation rate limit (10 requests / hour).
 * Returns a 429 response if exceeded, or null if OK.
 */
export async function checkWorkspaceGenerationRateLimit(
  workspaceId: string
): Promise<NextResponse | null> {
  const limiter = makeWorkspaceGenerationLimiter();
  if (!limiter) {
    console.warn("[rate-limit] Upstash not configured — workspace generation rate limiting disabled");
    return null;
  }

  const result = await limiter.limit(workspaceId);
  if (!result.success) {
    return NextResponse.json(
      { error: "Generation limit reached for this workspace. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "3600",
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