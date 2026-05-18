import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function main() {
  console.log('Adding logo and favicon columns to school_profile...');
  try {
    await client.execute('ALTER TABLE school_profile ADD COLUMN school_logo TEXT DEFAULT ""');
    console.log('✅ Added school_logo column');
  } catch(e) {
    console.log('school_logo might already exist:', e.message);
  }
  
  try {
    await client.execute('ALTER TABLE school_profile ADD COLUMN school_favicon TEXT DEFAULT ""');
    console.log('✅ Added school_favicon column');
  } catch(e) {
    console.log('school_favicon might already exist:', e.message);
  }

  process.exit(0);
}

main().catch(console.error);
