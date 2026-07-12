interface RateLimitRecord {
  timestamps: number[];
}

const globalWithRateLimit = globalThis as typeof globalThis & {
  _rateLimitMap?: Map<string, RateLimitRecord>;
};

if (!globalWithRateLimit._rateLimitMap) {
  globalWithRateLimit._rateLimitMap = new Map<string, RateLimitRecord>();
}

const rateLimitMap = globalWithRateLimit._rateLimitMap;

/**
 * Checks if a user has exceeded the rate limit.
 * Default: Max 10 requests per user per hour (60 * 60 * 1000 ms).
 */
export function checkRateLimit(
  userId: string,
  limit: number = 10,
  windowMs: number = 60 * 60 * 1000
): { allowed: boolean; remaining: number; resetTimeMs?: number } {
  const now = Date.now();
  let record = rateLimitMap.get(userId);
  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(userId, record);
  }

  // Filter out timestamps older than the window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetTimeMs = oldest + windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetTimeMs,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
  };
}
