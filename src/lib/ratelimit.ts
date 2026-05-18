import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

// ─── DEV Bypass Strategy ──────────────────────────────────────────
// Rate limiting is bypassed when:
// 1. Running in development mode (import.meta.env.DEV)
// 2. RATE_LIMIT_DISABLED=true environment variable is set
function isRateLimitDisabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.RATE_LIMIT_DISABLED === "true") return true;
  return false;
}

// ─── Redis Client (Lazy Singleton) ────────────────────────────────
// Edge-safe: @upstash/redis uses HTTP fetch, no TCP sockets.
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: import.meta.env.UPSTASH_REDIS_REST_URL,
      token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

// ─── Limiter Instances (Lazy Singletons) ──────────────────────────

let _inboxLimiter: Ratelimit | null = null;
let _loginLimiter: Ratelimit | null = null;
let _mediaOpsLimiter: Ratelimit | null = null;

/**
 * Inbox limiter: 3 requests per 10 minutes per IP.
 * Sliding Window algorithm for smooth traffic dampening.
 */
function getInboxLimiter(): Ratelimit {
  if (!_inboxLimiter) {
    _inboxLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(3, "10 m"),
      prefix: "rl:inbox",
      analytics: false,
      timeout: 1000, // Fail-open after 1 second
    });
  }
  return _inboxLimiter;
}

/**
 * Login limiter: 5 requests per 5 minutes per IP.
 * Sliding Window algorithm for credential stuffing protection.
 */
function getLoginLimiter(): Ratelimit {
  if (!_loginLimiter) {
    _loginLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, "5 m"),
      prefix: "rl:login",
      analytics: false,
      timeout: 1000, // Fail-open after 1 second
    });
  }
  return _loginLimiter;
}

/**
 * Media operations limiter: 20 tokens per 1 hour per user (session-based).
 * Token Bucket algorithm with burst allowance (max 5 concurrent).
 * 
 * Config: refillRate=5 tokens per "12 m" (= 20 tokens/hour), maxTokens=5 (burst cap)
 * 
 * Why Token Bucket:
 * - Allows burst of up to 5 rapid uploads/deletes
 * - Refills steadily: 5 tokens every 12 minutes = 20/hour
 * - maxTokens=5 caps the burst buffer
 */
function getMediaOpsLimiter(): Ratelimit {
  if (!_mediaOpsLimiter) {
    _mediaOpsLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.tokenBucket(5, "12 m", 5),
      prefix: "rl:media-ops",
      analytics: false,
      timeout: 1000, // Fail-open after 1 second
    });
  }
  return _mediaOpsLimiter;
}

// ─── IP Extraction (Cloudflare-Compatible) ────────────────────────
// Priority: CF-Connecting-IP > X-Forwarded-For > X-Real-IP > fallback
export function getClientIP(request: Request): string {
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;

  return "127.0.0.1";
}

// ─── Standardized 429 Response Builder ────────────────────────────
interface RateLimitResponseOptions {
  limit: number;
  remaining: number;
  reset: number; // epoch milliseconds
  policy: string;
  requiresCaptcha?: boolean;
  errorMessage?: string;
}

export function buildRateLimitResponse(opts: RateLimitResponseOptions): Response {
  const now = Date.now();
  const retryAfterSec = Math.max(1, Math.ceil((opts.reset - now) / 1000));

  return new Response(
    JSON.stringify({
      error: opts.errorMessage || "Terlalu banyak permintaan. Silakan coba lagi nanti.",
      retryAfter: retryAfterSec,
      ...(opts.requiresCaptcha ? { requiresCaptcha: true } : {}),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(opts.limit),
        "X-RateLimit-Remaining": String(opts.remaining),
        "X-RateLimit-Reset": String(opts.reset),
        "X-RateLimit-Policy": opts.policy,
      },
    }
  );
}

// ─── Public API: Check Rate Limits ────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  response?: Response; // Pre-built 429 response if blocked
}

/**
 * Check rate limit for POST /api/inbox.
 * Returns { allowed: true } if request should proceed.
 * Returns { allowed: false, response: 429 } if blocked.
 */
export async function checkInboxRateLimit(request: Request): Promise<RateLimitResult> {
  if (isRateLimitDisabled()) return { allowed: true };

  const ip = getClientIP(request);

  try {
    const result = await getInboxLimiter().limit(ip);

    if (!result.success) {
      console.warn(`[ABUSE_DETECTED] [${ip}] [Inbox] Rate limit exceeded (${result.limit} max)`);
      return {
        allowed: false,
        response: buildRateLimitResponse({
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          policy: "3;w=600;comment=\"inbox\"",
          requiresCaptcha: true,
        }),
      };
    }

    return { allowed: true };
  } catch (error) {
    // Fail-open: if Upstash is unreachable, allow the request
    console.error("[RATE_LIMIT_BYPASS] Upstash error on inbox check:", error);
    return { allowed: true };
  }
}

/**
 * Check rate limit for POST /api/auth/login.
 * Returns { allowed: true } if request should proceed.
 * Returns { allowed: false, response: 429 } if blocked.
 */
export async function checkLoginRateLimit(request: Request): Promise<RateLimitResult> {
  if (isRateLimitDisabled()) return { allowed: true };

  const ip = getClientIP(request);

  try {
    const result = await getLoginLimiter().limit(ip);

    if (!result.success) {
      console.warn(`[ABUSE_DETECTED] [${ip}] [Auth/Login] Rate limit exceeded (${result.limit} max)`);
      return {
        allowed: false,
        response: buildRateLimitResponse({
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          policy: "5;w=300;comment=\"login\"",
        }),
      };
    }

    return { allowed: true };
  } catch (error) {
    // Fail-open: if Upstash is unreachable, allow the request
    console.error("[RATE_LIMIT_BYPASS] Upstash error on login check:", error);
    return { allowed: true };
  }
}

/**
 * Reset login rate limit counter for a specific IP.
 * Called after successful login to prevent false lockouts.
 */
export async function resetLoginRateLimit(request: Request): Promise<void> {
  if (isRateLimitDisabled()) return;

  const ip = getClientIP(request);

  try {
    await getLoginLimiter().resetUsedTokens(ip);
  } catch (error) {
    // Non-critical: don't fail the login if reset fails
    console.error("[RATE_LIMIT_BYPASS] Failed to reset login counter:", error);
  }
}

// ─── Phase 2: Media Operations (Upload / Delete) ─────────────────

/**
 * Weighted cost calculation for upload operations.
 * - ≤ 5MB  → cost 1 token
 * - > 5MB  → cost 2 tokens
 * - > 15MB → cost 5 tokens
 */
export function getUploadCost(fileSizeBytes: number): number {
  const mb = fileSizeBytes / (1024 * 1024);
  if (mb > 15) return 5;
  if (mb > 5) return 2;
  return 1;
}

/**
 * Weighted cost calculation for delete operations.
 * - normal delete      → cost 1 token
 * - orphan recovery    → cost 2 tokens (extra processing)
 */
export function getDeleteCost(isOrphanRecovery: boolean): number {
  return isOrphanRecovery ? 2 : 1;
}

/**
 * Check rate limit for media operations (upload / delete).
 * Session-based: uses user ID as identifier (not IP).
 * Supports weighted cost via the `cost` parameter.
 *
 * @param userId - The authenticated user's ID (from locals.user.id)
 * @param cost - Number of tokens to consume (default 1)
 * @param operation - Label for structured logging ("upload" | "delete")
 */
export async function checkMediaOperationRateLimit(
  userId: string,
  cost: number = 1,
  operation: string = "media-op"
): Promise<RateLimitResult> {
  if (isRateLimitDisabled()) return { allowed: true };

  try {
    const result = await getMediaOpsLimiter().limit(userId, { rate: cost });

    if (!result.success) {
      console.warn(
        `[ABUSE_DETECTED] [user:${userId}] [${operation}] Media rate limit exceeded ` +
        `(cost=${cost}, limit=${result.limit}, remaining=${result.remaining})`
      );
      return {
        allowed: false,
        response: buildRateLimitResponse({
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          policy: `20;w=3600;burst=5;comment="${operation}"`,
          errorMessage: "Terlalu banyak operasi media. Silakan coba lagi nanti.",
        }),
      };
    }

    return { allowed: true };
  } catch (error) {
    // Fail-open: if Upstash is unreachable, allow the request
    console.error(`[RATE_LIMIT_BYPASS] Upstash error on ${operation} check:`, error);
    return { allowed: true };
  }
}

// ─── Phase 3: Admin Mutation Protection (Middleware-Level) ────────

let _adminMutationLimiter: Ratelimit | null = null;

/**
 * Admin mutation limiter: 60 mutations per 1 minute per user (session-based).
 * Token Bucket algorithm with burst allowance (max 20 concurrent).
 *
 * Config: refillRate=20 tokens per "20 s" (= 60 tokens/min), maxTokens=20 (burst cap)
 */
function getAdminMutationLimiter(): Ratelimit {
  if (!_adminMutationLimiter) {
    _adminMutationLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.tokenBucket(20, "20 s", 20),
      prefix: "rl:admin-mutation",
      analytics: false,
      timeout: 1000, // Fail-open after 1 second
    });
  }
  return _adminMutationLimiter;
}

// Routes that are EXCLUDED from admin mutation limiter
// because they already have their own dedicated limiter (Phase 1 & 2)
const MUTATION_LIMITER_EXCLUSIONS = new Set([
  "POST:/api/inbox",         // Phase 1: inbox limiter
  "POST:/api/auth/login",    // Phase 1: login limiter
  "POST:/api/auth/logout",   // No abuse risk
  "POST:/api/upload",        // Phase 2: media ops limiter
]);

// Routes with DELETE on /api/media/* are excluded (Phase 2 media ops limiter)
function isMediaDeleteExcluded(method: string, pathname: string): boolean {
  return method === "DELETE" && pathname.startsWith("/api/media/");
}

/**
 * Weighted cost calculation for admin mutation operations.
 * - reorder endpoints → cost 5 (multi-write atomic transaction)
 * - profile update    → cost 2 (multi-field update)
 * - all other CRUD    → cost 1
 */
export function getAdminMutationCost(pathname: string): number {
  if (pathname.endsWith("/reorder")) return 5;
  if (pathname === "/api/profile") return 2;
  return 1;
}

/**
 * Check rate limit for admin mutations.
 * Called from middleware after authentication succeeds.
 * Session-based: uses user ID as identifier (not IP).
 *
 * @param userId - The authenticated user's ID
 * @param pathname - The request pathname (for cost calculation and logging)
 * @param method - The HTTP method
 * @returns RateLimitResult with optional pre-built 429 response
 */
export async function checkAdminMutationRateLimit(
  userId: string,
  pathname: string,
  method: string
): Promise<RateLimitResult> {
  if (isRateLimitDisabled()) return { allowed: true };

  // Skip routes that have their own dedicated limiter
  const key = `${method.toUpperCase()}:${pathname}`;
  if (MUTATION_LIMITER_EXCLUSIONS.has(key)) return { allowed: true };
  if (isMediaDeleteExcluded(method.toUpperCase(), pathname)) return { allowed: true };

  const cost = getAdminMutationCost(pathname);

  try {
    const result = await getAdminMutationLimiter().limit(userId, { rate: cost });

    if (!result.success) {
      console.warn(
        `[ABUSE_DETECTED] [user:${userId}] [${method} ${pathname}] ` +
        `Admin mutation rate limit exceeded (cost=${cost}, limit=${result.limit}, remaining=${result.remaining})`
      );
      return {
        allowed: false,
        response: buildRateLimitResponse({
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          policy: `60;w=60;burst=20;comment="admin-mutation"`,
          errorMessage: "Terlalu banyak operasi admin. Silakan coba lagi nanti.",
        }),
      };
    }

    return { allowed: true };
  } catch (error) {
    // Fail-open: if Upstash is unreachable, allow the request
    console.error(`[RATE_LIMIT_BYPASS] Upstash error on admin mutation check:`, error);
    return { allowed: true };
  }
}

// ─── Phase 4: Public Read API Protection ─────────────────────────

let _publicReadLimiter: Ratelimit | null = null;
let _crawlerReadLimiter: Ratelimit | null = null;

/**
 * Public read limiter: 100 req per 10 seconds per IP.
 * Token Bucket algorithm for burst support (max 200 burst).
 *
 * Note: User requested Fixed Window for minimal latency, but Fixed Window
 * doesn't support burst allowance natively. Token Bucket with high refill
 * rate achieves the same lightweight profile while enabling burst=200.
 *
 * Config: refillRate=100 tokens per "10 s", maxTokens=200 (burst cap)
 */
function getPublicReadLimiter(): Ratelimit {
  if (!_publicReadLimiter) {
    _publicReadLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.tokenBucket(100, "10 s", 200),
      prefix: "rl:public-read",
      analytics: false,
      timeout: 1000, // Fail-open after 1 second
    });
  }
  return _publicReadLimiter;
}

/**
 * Crawler-aware limiter: 500 req per 10 seconds per IP.
 * 5x more generous than normal public read for legitimate crawlers.
 * Separate bucket so crawler traffic doesn't pollute normal user quota.
 */
function getCrawlerReadLimiter(): Ratelimit {
  if (!_crawlerReadLimiter) {
    _crawlerReadLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.tokenBucket(500, "10 s", 1000),
      prefix: "rl:crawler-read",
      analytics: false,
      timeout: 1000,
    });
  }
  return _crawlerReadLimiter;
}

// ─── Crawler Detection (Lightweight UA Heuristics) ────────────────
// Known legitimate crawler User-Agent patterns
const CRAWLER_UA_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /yandexbot/i,
  /duckduckbot/i,
  /baiduspider/i,
  /slurp/i,           // Yahoo
  /facebot/i,         // Facebook
  /twitterbot/i,
  /linkedinbot/i,
  /applebot/i,
  /msnbot/i,
];

/**
 * Lightweight crawler detection via User-Agent heuristics.
 * Returns true if the UA matches a known search engine crawler.
 *
 * Note: UA can be spoofed, but the crawler still gets rate-limited
 * (just with a more generous quota). This prevents abuse while being
 * SEO-safe for legitimate crawlers.
 */
function isLikelyCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return CRAWLER_UA_PATTERNS.some(pattern => pattern.test(userAgent));
}

/**
 * Check rate limit for public read API requests.
 * IP-based limiter with crawler-aware soft bypass.
 *
 * - Normal traffic: 100 req/10s per IP (burst 200)
 * - Crawler traffic: 500 req/10s per IP (burst 1000)
 *
 * @param request - The incoming HTTP request
 * @param pathname - The request pathname (for logging)
 */
export async function checkPublicReadRateLimit(
  request: Request,
  pathname: string
): Promise<RateLimitResult> {
  if (isRateLimitDisabled()) return { allowed: true };

  const ip = getClientIP(request);
  const ua = request.headers.get("user-agent");
  const isCrawler = isLikelyCrawler(ua);

  try {
    const limiter = isCrawler ? getCrawlerReadLimiter() : getPublicReadLimiter();
    const result = await limiter.limit(ip);

    if (!result.success) {
      const uaShort = ua ? ua.substring(0, 60) : "unknown";
      console.warn(
        `[ABUSE_DETECTED] [${ip}] [public-read] Rate limit exceeded ` +
        `(path=${pathname}, remaining=${result.remaining}, ` +
        `crawler=${isCrawler}, ua="${uaShort}")`
      );
      return {
        allowed: false,
        response: buildRateLimitResponse({
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          policy: isCrawler
            ? `500;w=10;burst=1000;comment="crawler-read"`
            : `100;w=10;burst=200;comment="public-read"`,
          errorMessage: "Too many requests. Please slow down.",
        }),
      };
    }

    return { allowed: true };
  } catch (error) {
    // Fail-open: if Upstash is unreachable, allow the request
    console.error("[RATE_LIMIT_BYPASS] Upstash error on public read check:", error);
    return { allowed: true };
  }
}
