import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { getEnv } from '@/lib/context';

let cachedDb: any = null;

function getDbInstance() {
  if (!cachedDb) {
    const url = getEnv('TURSO_CONNECTION_URL') || getEnv('TURSO_DATABASE_URL');
    const authToken = getEnv('TURSO_AUTH_TOKEN');
    const client = createClient({ url, authToken });
    cachedDb = drizzle(client, { schema });
  }
  return cachedDb;
}

export const db = new Proxy({} as any, {
  get(target, prop, receiver) {
    const instance = getDbInstance();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});
