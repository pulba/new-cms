import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

const statements = [
  `CREATE TABLE IF NOT EXISTS admission_programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    academic_year TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    registration_open INTEGER DEFAULT 0,
    start_date TEXT,
    end_date TEXT,
    enable_major_selection INTEGER DEFAULT 0,
    max_applicants INTEGER,
    auto_close_when_full INTEGER DEFAULT 0,
    description TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS admission_majors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL REFERENCES admission_programs(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    quota INTEGER NOT NULL DEFAULT 0,
    current_applicants INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number TEXT NOT NULL UNIQUE,
    program_id INTEGER NOT NULL REFERENCES admission_programs(id),
    major_id INTEGER REFERENCES admission_majors(id),
    status TEXT DEFAULT 'pending',
    admin_note TEXT,
    full_name TEXT NOT NULL,
    nick_name TEXT,
    birth_place TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    gender TEXT NOT NULL,
    religion TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT NOT NULL,
    origin_school TEXT NOT NULL,
    origin_school_address TEXT,
    father_name TEXT NOT NULL,
    father_phone TEXT,
    father_occupation TEXT,
    father_address TEXT,
    mother_name TEXT NOT NULL,
    mother_phone TEXT,
    mother_occupation TEXT,
    mother_address TEXT,
    extra_data TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS registration_status_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER NOT NULL REFERENCES registrations(id),
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    changed_by TEXT,
    admin_note TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS registration_sequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL UNIQUE REFERENCES admission_programs(id),
    prefix TEXT NOT NULL DEFAULT 'REG',
    year TEXT NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0
  )`,
  // Indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_registrations_program_status ON registrations(program_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_registrations_number ON registrations(registration_number)`,
  `CREATE INDEX IF NOT EXISTS idx_majors_program ON admission_majors(program_id)`,
  `CREATE INDEX IF NOT EXISTS idx_status_logs_registration ON registration_status_logs(registration_id)`,
];

async function migrate() {
  console.log('🚀 Starting Admissions Module migration...\n');

  for (const sql of statements) {
    const label = sql.trim().substring(0, 60).replace(/\s+/g, ' ');
    try {
      await client.execute(sql);
      console.log(`✅ ${label}...`);
    } catch (err) {
      console.error(`❌ Failed: ${label}...`);
      console.error(`   Error: ${err.message}`);
    }
  }

  console.log('\n✅ Migration complete!');
}

migrate().catch(console.error);
