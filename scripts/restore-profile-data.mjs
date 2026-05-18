import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function main() {
  console.log('Reading backup data...');
  const backup = await client.execute(`SELECT * FROM school_profile_backup LIMIT 1`);
  
  if (backup.rows.length === 0) {
    console.log('No backup data found.');
    process.exit(0);
  }

  const row = backup.rows[0];
  const columns = backup.columns;

  console.log(`Found ${columns.length} columns to migrate`);

  // Convert each column (except id) into a key-value pair
  const pairs = [];
  for (const col of columns) {
    if (col === 'id') continue;
    const val = row[col];
    if (val !== null && val !== undefined) {
      pairs.push({ key: col, value: String(val) });
    }
  }

  console.log(`Inserting ${pairs.length} key-value pairs...`);

  for (const { key, value } of pairs) {
    await client.execute({
      sql: `INSERT INTO school_profile (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [key, value],
    });
    console.log(`  ✅ ${key}`);
  }

  console.log('\n✅ Data migration complete!');
  
  // Verify
  const count = await client.execute(`SELECT COUNT(*) as cnt FROM school_profile`);
  console.log(`Total rows in school_profile: ${count.rows[0].cnt}`);

  process.exit(0);
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
