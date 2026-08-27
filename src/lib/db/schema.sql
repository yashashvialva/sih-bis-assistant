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
        1 - (bc.embedding <=> query_embedding) AS similarity
    FROM bis_chunks bc
    WHERE 1 - (bc.embedding <=> query_embedding) > match_threshold
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
