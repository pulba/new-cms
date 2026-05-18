import type { APIRoute } from "astro";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * POST /api/posts/[id]/view
 * Lightweight view counter increment.
 * Public endpoint — no auth required.
 * 
 * Anti-spam strategy:
 * - IP-based throttle via in-memory Map
 * - 60-second cooldown per IP per post
 * - Lazy cleanup on every request (Cloudflare Workers compatible)
 * - No localStorage or session dependency
 * 
 * Note: On Cloudflare Workers, the in-memory Map resets per isolate.
 * This means throttling is best-effort, not guaranteed across all edge nodes.
 * For stronger protection, use Cloudflare KV or D1 in the future.
 */

// In-memory throttle map: key = "ip:postId", value = timestamp
const viewThrottle = new Map<string, number>();
const THROTTLE_WINDOW_MS = 60_000; // 60 seconds
const MAX_MAP_SIZE = 5000; // prevent unbounded growth

// Lazy cleanup — runs on each request instead of setInterval
function cleanupThrottle() {
  if (viewThrottle.size < 100) return; // skip cleanup for small maps
  const now = Date.now();
  for (const [key, ts] of viewThrottle) {
    if (now - ts > THROTTLE_WINDOW_MS * 2) {
      viewThrottle.delete(key);
    }
  }
  // Hard cap: if still too large, clear oldest half
  if (viewThrottle.size > MAX_MAP_SIZE) {
    const entries = [...viewThrottle.entries()].sort((a, b) => a[1] - b[1]);
    const toRemove = entries.slice(0, Math.floor(entries.length / 2));
    for (const [key] of toRemove) {
      viewThrottle.delete(key);
    }
  }
}

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: "Invalid post ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Lazy cleanup on each request
    cleanupThrottle();

    // Extract IP for throttling
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const throttleKey = `${ip}:${id}`;
    const lastView = viewThrottle.get(throttleKey);
    const now = Date.now();

    if (lastView && now - lastView < THROTTLE_WINDOW_MS) {
      // Silently accept but don't increment — no error to the client
      return new Response(JSON.stringify({ ok: true, throttled: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Atomic increment
    await db
      .update(posts)
      .set({ viewCount: sql`COALESCE(${posts.viewCount}, 0) + 1` })
      .where(eq(posts.id, id));

    // Record throttle
    viewThrottle.set(throttleKey, now);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[posts/view]", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
