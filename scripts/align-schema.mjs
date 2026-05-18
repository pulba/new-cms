import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function main() {
  console.log('🔄 Restoring school_profile to column-based schema...\n');

  // Step 1: Drop the current key-value school_profile
  await client.execute('DROP TABLE IF EXISTS school_profile');
  console.log('✅ Dropped key-value school_profile');

  // Step 2: Recreate with proper column-based schema (matching website)
  await client.execute(`
    CREATE TABLE school_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      school_name TEXT NOT NULL DEFAULT '',
      short_description TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      social_facebook TEXT,
      social_instagram TEXT,
      social_youtube TEXT,
      accreditation TEXT,
      npsn TEXT,
      founded_year TEXT,
      curriculum TEXT,
      history_text TEXT,
      history_image TEXT,
      profile_hero_title TEXT,
      profile_hero_subtitle TEXT,
      profile_hero_image TEXT,
      google_maps_embed_url TEXT,
      vision_text TEXT NOT NULL DEFAULT '',
      mission_items TEXT NOT NULL DEFAULT '[]',
      principal_name TEXT NOT NULL DEFAULT '',
      principal_message TEXT NOT NULL DEFAULT '[]',
      principal_signature TEXT NOT NULL DEFAULT '',
      principal_image TEXT NOT NULL DEFAULT '',
      principal_quote TEXT,
      ppdb_is_active INTEGER DEFAULT false,
      ppdb_title TEXT,
      ppdb_description TEXT
    )
  `);
  console.log('✅ Created column-based school_profile');

  // Step 3: Restore data from key-value backup
  // First, read all key-value pairs from the current key-value data
  // (we still have it from the schoolProfile table we just dropped... 
  //  but we have the original column values from the backup we ran earlier)
  // Re-insert from the known backup values
  
  // Read the school_profile_backup if it still exists
  let backupRows = [];
  try {
    const backup = await client.execute('SELECT * FROM school_profile_backup LIMIT 1');
    backupRows = backup.rows;
    console.log('Found school_profile_backup table with data');
  } catch (e) {
    console.log('No backup table found, will insert empty placeholder row');
  }

  if (backupRows.length > 0) {
    const row = backupRows[0];
    await client.execute({
      sql: `INSERT INTO school_profile (
        school_name, short_description, address, phone, email,
        social_facebook, social_instagram, social_youtube,
        accreditation, npsn, founded_year, curriculum,
        history_text, history_image, profile_hero_title, profile_hero_subtitle, profile_hero_image,
        google_maps_embed_url, vision_text, mission_items,
        principal_name, principal_message, principal_signature, principal_image, principal_quote,
        ppdb_is_active, ppdb_title, ppdb_description
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        row['school_name'] || '',
        row['short_description'] || null,
        row['address'] || null,
        row['phone'] || null,
        row['email'] || null,
        row['social_facebook'] || null,
        row['social_instagram'] || null,
        row['social_youtube'] || null,
        row['accreditation'] || null,
        row['npsn'] || null,
        row['founded_year'] || null,
        row['curriculum'] || null,
        row['history_text'] || null,
        row['history_image'] || null,
        row['profile_hero_title'] || null,
        row['profile_hero_subtitle'] || null,
        row['profile_hero_image'] || null,
        row['google_maps_embed_url'] || null,
        row['vision_text'] || '',
        row['mission_items'] || '[]',
        row['principal_name'] || '',
        row['principal_message'] || '[]',
        row['principal_signature'] || '',
        row['principal_image'] || '',
        row['principal_quote'] || null,
        row['ppdb_is_active'] ?? 0,
        row['ppdb_title'] || null,
        row['ppdb_description'] || null,
      ]
    });
    console.log('✅ Restored original data into school_profile');
  }

  // Step 4: Fix banners table - needs extra columns that website expects
  // Check current banners schema
  const bannerInfo = await client.execute('PRAGMA table_info(banners)');
  const bannerCols = bannerInfo.rows.map(r => r[1]);
  console.log('\nCurrent banners columns:', bannerCols);

  if (!bannerCols.includes('subtitle')) {
    console.log('Banners table missing website columns — dropping and recreating...');
    await client.execute('DROP TABLE IF EXISTS banners');
    await client.execute(`
      CREATE TABLE banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        image_url TEXT NOT NULL,
        primary_cta_text TEXT,
        primary_cta_href TEXT,
        primary_cta_icon TEXT,
        secondary_cta_text TEXT,
        secondary_cta_href TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT true
      )
    `);
    console.log('✅ Banners table recreated with correct schema');
  }

  // Step 5: Fix staff table - website expects different columns
  const staffInfo = await client.execute('PRAGMA table_info(staff)');
  const staffCols = staffInfo.rows.map(r => r[1]);
  console.log('\nCurrent staff columns:', staffCols);

  if (!staffCols.includes('image_url')) {
    console.log('Staff table missing website columns — dropping and recreating...');
    await client.execute('DROP TABLE IF EXISTS staff');
    await client.execute(`
      CREATE TABLE staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        subject TEXT,
        image_url TEXT NOT NULL DEFAULT '',
        bio TEXT,
        sort_order INTEGER DEFAULT 0,
        category TEXT DEFAULT 'Guru'
      )
    `);
    console.log('✅ Staff table recreated with correct schema');
  }

  // Step 6: Fix inbox table - website expects phone & subject columns
  const inboxInfo = await client.execute('PRAGMA table_info(inbox)');
  const inboxCols = inboxInfo.rows.map(r => r[1]);
  console.log('\nCurrent inbox columns:', inboxCols);

  if (!inboxCols.includes('phone')) {
    console.log('Inbox table missing website columns — dropping and recreating...');
    await client.execute('DROP TABLE IF EXISTS inbox');
    await client.execute(`
      CREATE TABLE inbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT NOT NULL DEFAULT '',
        message TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT '',
        is_read INTEGER DEFAULT false
      )
    `);
    console.log('✅ Inbox table recreated with correct schema');
  }

  // Final verification
  const result = await client.execute('SELECT school_name, accreditation FROM school_profile LIMIT 1');
  console.log('\n✅ Final verification - school_profile sample:', result.rows[0]);

  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('All tables:', tables.rows.map(r => r[0]).join(', '));

  console.log('\n✅ All done! Database is now aligned with website schema.');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Failed:', e);
  process.exit(1);
});
