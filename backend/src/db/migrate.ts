import { pool } from './client'

export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      utm_source TEXT,
      device TEXT,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'bot', 'manager')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID,
      contact_type TEXT,
      contact_value TEXT,
      apartment_params JSONB,
      estimate_min BIGINT,
      estimate_max BIGINT,
      selected_segment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_session_id_fkey;

    CREATE TABLE IF NOT EXISTS estimates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
      params_json JSONB,
      result_json JSONB,
      pdf_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS work_types (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      unit TEXT,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS price_matrix (
      work_type_id INT REFERENCES work_types(id) ON DELETE CASCADE,
      segment TEXT NOT NULL,
      price_min NUMERIC,
      price_max NUMERIC,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(work_type_id, segment)
    );
  `)
  console.log('Migrations complete')
}
