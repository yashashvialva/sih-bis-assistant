-- ═══════════════════════════════════════════════════════════
-- BIS Compliance Assistant — Migration 002: Ingestion Tables
-- PostgreSQL + pgvector (Supabase)
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Trusted Source Allowlist ─────────────────────────

CREATE TABLE IF NOT EXISTS trusted_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    base_url TEXT NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('OFFICIAL_BIS', 'OFFICIAL_GOVERNMENT', 'TRUSTED_SECONDARY')),
    enabled BOOLEAN DEFAULT true,
    allowed_paths TEXT[],
    verification_policy VARCHAR(50) DEFAULT 'REQUIRES_REVIEW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 2. Source Documents ─────────────────────────────────

CREATE TABLE IF NOT EXISTS source_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES trusted_sources(id),
    source_url TEXT NOT NULL UNIQUE,
    source_domain VARCHAR(255) NOT NULL,
    title TEXT,
    standard_number VARCHAR(100),
    document_type VARCHAR(50),
    verification_status VARCHAR(50) DEFAULT 'PENDING_REVIEW'
        CHECK (verification_status IN ('PENDING_REVIEW', 'AUTHORITATIVE', 'TRUSTED_SECONDARY', 'UNVERIFIED', 'DEMO', 'REJECTED')),
    authoritative BOOLEAN DEFAULT false,
    discovered_by VARCHAR(100) DEFAULT 'auto_discovery',
    last_checked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_source_documents_source ON source_documents(source_id);
CREATE INDEX IF NOT EXISTS idx_source_documents_standard ON source_documents(standard_number);
CREATE INDEX IF NOT EXISTS idx_source_documents_status ON source_documents(verification_status);

-- ─── 3. Source Document Versions ─────────────────────────

CREATE TABLE IF NOT EXISTS source_document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES source_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    content_hash VARCHAR(128) NOT NULL,
    raw_content TEXT,
    extracted_text TEXT,
    page_count INTEGER,
    retrieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_current BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_doc_versions_document ON source_document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_versions_hash ON source_document_versions(content_hash);

-- ─── 4. Ingestion Jobs ──────────────────────────────────

CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(50) DEFAULT 'RUNNING'
        CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    trigger_type VARCHAR(50) NOT NULL
        CHECK (trigger_type IN ('MANUAL', 'SCHEDULED', 'ADMIN')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    sources_discovered INTEGER DEFAULT 0,
    sources_fetched INTEGER DEFAULT 0,
    sources_rejected INTEGER DEFAULT 0,
    documents_created INTEGER DEFAULT 0,
    documents_updated INTEGER DEFAULT 0,
    chunks_created INTEGER DEFAULT 0,
    embeddings_generated INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    log JSONB DEFAULT '[]'::jsonb
);

-- ─── 5. Ingestion Events ────────────────────────────────

CREATE TABLE IF NOT EXISTS ingestion_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    document_id UUID REFERENCES source_documents(id),
    standard_number VARCHAR(100),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_events_type ON ingestion_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ingestion_events_document ON ingestion_events(document_id);

-- ─── 6. Add FK from bis_chunks to source_documents ──────

ALTER TABLE bis_chunks ADD COLUMN IF NOT EXISTS source_document_id UUID REFERENCES source_documents(id);
CREATE INDEX IF NOT EXISTS idx_bis_chunks_source_doc ON bis_chunks(source_document_id);

-- ─── 7. RLS for new tables ──────────────────────────────

ALTER TABLE trusted_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_events ENABLE ROW LEVEL SECURITY;

-- Read-only for authenticated users
CREATE POLICY "Trusted sources readable by all" ON trusted_sources FOR SELECT USING (true);
CREATE POLICY "Source documents readable by all" ON source_documents FOR SELECT USING (true);
CREATE POLICY "Source versions readable by all" ON source_document_versions FOR SELECT USING (true);
CREATE POLICY "Ingestion jobs readable by all" ON ingestion_jobs FOR SELECT USING (true);
CREATE POLICY "Ingestion events readable by all" ON ingestion_events FOR SELECT USING (true);
