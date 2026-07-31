import { NextResponse } from 'next/server';

interface RateLimitOptions {
  limit?: number; // max requests per window
  windowMs?: number; // window size in milliseconds
  prefix?: string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  ip: string;
}

// In-memory sliding window store for environments without Upstash Redis
const memoryStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup expired memory store entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, 300000);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

export async function checkRateLimit(
  request: Request,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const limit = options.limit || 10;
  const windowMs = options.windowMs || 60000;
  const prefix = options.prefix || 'rl';

  const ip = getClientIp(request);
  const key = `${prefix}:${ip}`;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Upstash Redis REST API Rate Limiter
  if (redisUrl && redisToken) {
    try {
      const incrRes = await fetch(`${redisUrl}/incr/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });

      if (incrRes.ok) {
        const incrData = await incrRes.json();
        const count = incrData.result || 1;

        if (count === 1) {
          // Set TTL window for key
          await fetch(`${redisUrl}/expire/${encodeURIComponent(key)}/${Math.ceil(windowMs / 1000)}`, {
            headers: { Authorization: `Bearer ${redisToken}` }
          });
        }

        const remaining = Math.max(0, limit - count);
        return {
          success: count <= limit,
          limit,
          remaining,
          resetMs: windowMs,
          ip
        };
      }
    } catch {
      // Fall through to in-memory store
    }
  }

  // 2. In-Memory Sliding Window Rate Limiter
  const now = Date.now();
  let record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    memoryStore.set(key, record);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetMs: windowMs,
      ip
    };
  }

  record.count += 1;
  const remaining = Math.max(0, limit - record.count);
  const resetMs = Math.max(0, record.resetTime - now);

  return {
    success: record.count <= limit,
    limit,
    remaining,
    resetMs,
    ip
  };
}

export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSec = Math.ceil(result.resetMs / 1000) || 60;

  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: `Rate limit exceeded. You may only perform ${result.limit} requests per minute.`,
      retryAfterSeconds: retryAfterSec
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining)
      }
    }
  );
}
