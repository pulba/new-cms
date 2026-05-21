import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  env: Record<string, any>;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getEnv(key: string): string {
  const store = requestContext.getStore();
  if (store?.env && key in store.env) {
    return store.env[key] || "";
  }
  return (import.meta.env[key] as string) || "";
}
