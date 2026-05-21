/**
 * Request-scoped environment access for Cloudflare Workers.
 *
 * Uses a simple module-level store instead of node:async_hooks
 * to avoid compatibility issues with Cloudflare Pages Functions.
 *
 * The middleware calls `setRequestEnv()` at the start of each request,
 * making env vars available to all downstream code via `getEnv()`.
 */

export interface RequestContext {
  env: Record<string, any>;
}

// Module-level store — set by middleware at the start of each request.
let _currentEnv: Record<string, any> = {};

/**
 * Set the environment for the current request.
 * Called by the middleware before any route handler runs.
 */
export function setRequestEnv(env: Record<string, any>): void {
  _currentEnv = env;
}

/**
 * Get an environment variable.
 * Reads from the Cloudflare runtime env (set by middleware),
 * falls back to Vite's import.meta.env for build-time variables.
 */
export function getEnv(key: string): string {
  if (key in _currentEnv) {
    return _currentEnv[key] || "";
  }
  return (import.meta.env[key] as string) || "";
}
