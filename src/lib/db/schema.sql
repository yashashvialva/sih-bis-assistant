-- ═══════════════════════════════════════════════════════════
-- BIS Compliance Assistant — Database Schema
-- PostgreSQL + pgvector (Supabase)
-- ═══════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. BIS Corpus & Chunks ──────────────────────────────

CREATE TABLE bis_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_number VARCHAR(100) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    product_category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    source_type VARCHAR(50) DEFAULT 'official',
    verification_status VARCHAR(50) DEFAULT 'verified',
    authoritative BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bis_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_id UUID REFERENCES bis_standards(id) ON DELETE CASCADE,
    standard_number VARCHAR(100) NOT NULL,
    clause VARCHAR(100),
    section_title TEXT,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(768),
    source_type VARCHAR(50) DEFAULT 'official',
    verification_status VARCHAR(50) DEFAULT 'verified',
    authoritative BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bis_chunks_embedding ON bis_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_bis_chunks_standard ON bis_chunks(standard_id);

-- ─── 2. User Workspaces & Products ───────────────────────

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    standard_id UUID REFERENCES bis_standards(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_user ON products(user_id);

CREATE TABLE roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
    standard_id UUID REFERENCES bis_standards(id),
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE roadmap_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    source_chunk_id UUID REFERENCES bis_chunks(id),
    source_clause VARCHAR(100),
    confidence_level VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_roadmap_steps_roadmap ON roadmap_steps(roadmap_id);

-- ─── 3. Document Compliance Evidence ─────────────────────

CREATE TABLE uploaded_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    storage_path TEXT NOT NULL,
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE compliance_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES uploaded_documents(id) ON DELETE CASCADE,
    roadmap_step_id UUID REFERENCES roadmap_steps(id) ON DELETE CASCADE,
    source_clause VARCHAR(100),
    requirement_summary TEXT NOT NULL,
    extracted_evidence TEXT,
    assessment VARCHAR(50) NOT NULL,
    confidence_tag VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 4. Tier 3 — Simulated Amendments ───────────────────

CREATE TABLE simulated_amendments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_number VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    impact_summary TEXT NOT NULL,
    affected_clause VARCHAR(100),
    severity VARCHAR(50) DEFAULT 'REVIEW_RECOMMENDED',
    published_date DATE
);

-- ─── 5. Vector Similarity Search Function ────────────────

CREATE OR REPLACE FUNCTION match_bis_chunks(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.70,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    standard_number VARCHAR(100),
    clause VARCHAR(100),
    section_title TEXT,
    content TEXT,
    metadata JSONB,
    source_type VARCHAR(50),
    verification_status VARCHAR(50),
    authoritative BOOLEAN,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        bc.id,
        bc.standard_number,
        bc.clause,
        bc.section_title,
        bc.content,
        bc.metadata,
        bc.source_type,
        sd.verification_status,
        sd.authoritative,
        1 - (bc.embedding <=> query_embedding) AS similarity
    FROM bis_chunks bc
    JOIN source_documents sd ON bc.source_document_id = sd.id
    WHERE 1 - (bc.embedding <=> query_embedding) > match_threshold
      AND sd.verification_status = 'AUTHORITATIVE'
      AND sd.authoritative = true
    ORDER BY bc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ─── 6. Row Level Security (RLS) ────────────────────────

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evidence ENABLE ROW LEVEL SECURITY;

-- Products: Users can only access their own
CREATE POLICY "Users can manage their own products"
    ON products FOR ALL
    USING (auth.uid() = user_id);

-- Roadmaps: Through product ownership
CREATE POLICY "Users can manage their own roadmaps"
    ON roadmaps FOR ALL
    USING (
        product_id IN (
            SELECT id FROM products WHERE user_id = auth.uid()
        )
    );

-- Steps: Through roadmap → product ownership
CREATE POLICY "Users can manage their own roadmap steps"
    ON roadmap_steps FOR ALL
    USING (
        roadmap_id IN (
            SELECT r.id FROM roadmaps r
            JOIN products p ON r.product_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

-- Documents: Users can only access their own
CREATE POLICY "Users can manage their own documents"
    ON uploaded_documents FOR ALL
    USING (auth.uid() = user_id);

-- Evidence: Through document ownership
CREATE POLICY "Users can manage their own evidence"
    ON compliance_evidence FOR ALL
    USING (
        document_id IN (
            SELECT id FROM uploaded_documents WHERE user_id = auth.uid()
        )
    );

-- BIS corpus is read-only for all authenticated users
ALTER TABLE bis_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE bis_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "BIS standards are readable by all"
    ON bis_standards FOR SELECT
    USING (true);

CREATE POLICY "BIS chunks are readable by all"
    ON bis_chunks FOR SELECT
    USING (true);

-- 🗄️ 7. Verified Testing Laboratories 🗄️

CREATE TABLE laboratories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    laboratory_type VARCHAR(100), -- 'Govt', 'Private', 'In-house'
    latitude FLOAT,
    longitude FLOAT,
    accreditation_number VARCHAR(100),
    contact TEXT,
    website VARCHAR(255),
    source_url TEXT NOT NULL,
    source_type VARCHAR(50) DEFAULT 'NABL', -- 'NABL', 'BIS', 'Demo'
    verification_status VARCHAR(50) DEFAULT 'DISCOVERED', -- 'DISCOVERED', 'VERIFIED', 'ACCREDITED', 'BIS_RECOGNIZED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RPC for nearby labs using Haversine formula
CREATE OR REPLACE FUNCTION get_nearby_labs(
    user_lat FLOAT,
    user_lon FLOAT,
    radius_km FLOAT,
    lab_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    laboratory_type VARCHAR(100),
    accreditation_number VARCHAR(100),
    distance_km FLOAT,
    source_url TEXT,
    verification_status VARCHAR(50)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id, l.name, l.address, l.city, l.state, l.laboratory_type, l.accreditation_number,
        ( 6371 * acos( cos( radians(user_lat) ) * cos( radians( l.latitude ) ) * cos( radians( l.longitude ) - radians(user_lon) ) + sin( radians(user_lat) ) * sin( radians( l.latitude ) ) ) ) AS distance_km,
        l.source_url, l.verification_status
    FROM laboratories l
    WHERE l.verification_status IN ('VERIFIED', 'ACCREDITED', 'BIS_RECOGNIZED')
      AND (lab_type_filter IS NULL OR l.laboratory_type = lab_type_filter)
      AND ( 6371 * acos( cos( radians(user_lat) ) * cos( radians( l.latitude ) ) * cos( radians( l.longitude ) - radians(user_lon) ) + sin( radians(user_lat) ) * sin( radians( l.latitude ) ) ) ) <= radius_km
    ORDER BY distance_km ASC;
END;
$$;
