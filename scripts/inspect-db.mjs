import { createClient } from '@libsql/client';
import 'dotenv/config';

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function inspect() {
  // List all tables
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('=== EXISTING TABLES ===');
  for (const row of tables.rows) {
    console.log(`\nTable: ${row.name}`);
    const info = await client.execute(`PRAGMA table_info(${row.name})`);
    for (const col of info.rows) {
      console.log(`  - ${col.name} (${col.type})`);
    }
  }
}

inspect().catch(console.error);
