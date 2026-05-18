import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function main() {
  // Clean up temp tables
  await client.execute('DROP TABLE IF EXISTS school_profile_backup');
  await client.execute('DROP TABLE IF EXISTS school_profile_new');
  console.log('Cleaned up temp tables');

  // Verify final data
  const rows = await client.execute('SELECT key, value FROM school_profile LIMIT 5');
  console.log('\nSample school_profile data:');
  rows.rows.forEach(r => console.log(' ', r[0], ':', String(r[1]).substring(0, 60)));

  // List all tables
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('\nAll tables:', tables.rows.map(r => r[0]).join(', '));

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
