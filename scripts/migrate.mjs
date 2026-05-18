import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

const statements = [
  // Fix school_profile - drop and recreate if columns are wrong
  // First check by trying to add columns (will silently fail if already exists)
  `CREATE TABLE IF NOT EXISTS school_profile_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    UNIQUE(key)
  )`,

  // Create banners table
  `CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active INTEGER DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT
  )`,

  // Create inbox table
  `CREATE TABLE IF NOT EXISTS inbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT false,
    created_at TEXT
  )`,

  // Create osis table
  `CREATE TABLE IF NOT EXISTS osis (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL,
    position TEXT,
    photo TEXT,
    description TEXT
  )`,
];

async function main() {
  console.log('Connecting to Turso...');
  
  // First, check what columns school_profile actually has
  try {
    const result = await client.execute(`PRAGMA table_info(school_profile)`);
    console.log('Current school_profile columns:', result.rows.map(r => r[1]));
    
    const columns = result.rows.map(r => r[1]);
    
    if (!columns.includes('key')) {
      console.log('⚠️  school_profile is missing "key" column. Recreating table...');
      
      // Migrate data if any, then recreate
      await client.execute(`
        CREATE TABLE IF NOT EXISTS school_profile_backup AS SELECT * FROM school_profile
      `);
      await client.execute(`DROP TABLE school_profile`);
      await client.execute(`
        CREATE TABLE school_profile (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          key TEXT NOT NULL UNIQUE,
          value TEXT
        )
      `);
      console.log('✅ school_profile recreated with correct schema');
    } else {
      console.log('✅ school_profile already has correct columns');
    }
  } catch (e) {
    console.log('school_profile does not exist yet, will be created...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS school_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        key TEXT NOT NULL UNIQUE,
        value TEXT
      )
    `);
    console.log('✅ school_profile created');
  }

  // Create remaining tables
  for (const sql of statements.slice(1)) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    try {
      await client.execute(sql);
      console.log(`✅ Table "${tableName}" ready`);
    } catch (e) {
      console.error(`❌ Failed on "${tableName}":`, e.message);
    }
  }

  console.log('\n✅ Migration complete!');
  process.exit(0);
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
