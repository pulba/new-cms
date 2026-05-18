import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function main() {
  const result = await client.execute(`PRAGMA table_info(school_profile)`);
  console.log('school_profile columns:');
  result.rows.forEach(r => console.log(' -', r[1], ':', r[2]));

  const rows = await client.execute(`SELECT * FROM school_profile LIMIT 5`);
  console.log('\nCurrent data (first 5 rows):', rows.rows);

  const backup = await client.execute(`SELECT * FROM school_profile_backup LIMIT 3`);
  console.log('\nBackup data (first 3 rows):', backup.rows);
}

main().catch(console.error);
