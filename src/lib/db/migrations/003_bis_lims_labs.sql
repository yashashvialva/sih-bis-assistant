-- ═══════════════════════════════════════════════════════════
-- BIS LIMS Lab Discovery — Database Migration
-- ═══════════════════════════════════════════════════════════

-- 1. Add new columns to existing laboratories table
ALTER TABLE laboratories ADD COLUMN IF NOT EXISTS lab_code VARCHAR(50);
ALTER TABLE laboratories ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE laboratories ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE laboratories ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE laboratories ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE laboratories ADD COLUMN IF NOT EXISTS validity_date TEXT;
ALTER TABLE laboratories ADD COLUMN IF NOT EXISTS scope_url TEXT;
ALTER TABLE laboratories ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP WITH TIME ZONE;

-- Unique index on lab_code for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_laboratories_lab_code 
  ON laboratories(lab_code) WHERE lab_code IS NOT NULL;

-- Index for state-based queries
CREATE INDEX IF NOT EXISTS idx_laboratories_state 
  ON laboratories(state);

-- Index for source_type filtering
CREATE INDEX IF NOT EXISTS idx_laboratories_source_type 
  ON laboratories(source_type);

-- 2. Laboratory Scopes table
CREATE TABLE IF NOT EXISTS laboratory_scopes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laboratory_id UUID REFERENCES laboratories(id) ON DELETE CASCADE,
    standard_number VARCHAR(200) NOT NULL DEFAULT '',
    product TEXT NOT NULL DEFAULT '',
    grade_type_size TEXT NOT NULL DEFAULT '',
    testing_charges TEXT,
    validity_date TEXT,
    remark TEXT,
    source_url TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint to prevent duplicate scope records
CREATE UNIQUE INDEX IF NOT EXISTS idx_laboratory_scopes_unique
  ON laboratory_scopes(laboratory_id, standard_number, product, grade_type_size);

CREATE INDEX IF NOT EXISTS idx_laboratory_scopes_lab_id
  ON laboratory_scopes(laboratory_id);

-- RLS for laboratory_scopes
ALTER TABLE laboratory_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Laboratory scopes are readable by all"
    ON laboratory_scopes FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage laboratory scopes"
    ON laboratory_scopes FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. Lab Discovery Jobs table
CREATE TABLE IF NOT EXISTS lab_discovery_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    pages_discovered INT DEFAULT 0,
    labs_found INT DEFAULT 0,
    labs_inserted INT DEFAULT 0,
    labs_updated INT DEFAULT 0,
    scope_records_found INT DEFAULT 0,
    errors INT DEFAULT 0,
    logs JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- RLS for lab_discovery_jobs
ALTER TABLE lab_discovery_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lab discovery jobs are readable by all"
    ON lab_discovery_jobs FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage lab discovery jobs"
    ON lab_discovery_jobs FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. Update laboratories RLS to allow service role operations
-- Keep existing policies but ensure BIS_LIMS labs are readable
CREATE POLICY "Laboratories are readable by all"
    ON laboratories FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage laboratories"
    ON laboratories FOR ALL
    USING (true)
    WITH CHECK (true);
