-- ═══════════════════════════════════════════════════════════
-- BIS Compliance Assistant — Migration 003: Enhanced Amendments
-- Adds structured change tracking & product-based alert matching
-- ═══════════════════════════════════════════════════════════

-- Drop the old simulated_amendments table and recreate with enhanced schema
-- (Only safe because the old table had demo data only)
DROP TABLE IF EXISTS simulated_amendments;

CREATE TABLE IF NOT EXISTS amendments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_number VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    impact_summary TEXT NOT NULL,
    affected_clause VARCHAR(100),
    severity VARCHAR(50) DEFAULT 'REVIEW_RECOMMENDED'
        CHECK (severity IN ('REVIEW_RECOMMENDED', 'POTENTIAL_IMPACT', 'INFORMATION_ONLY')),
    published_date DATE,

    -- ─── New fields for smart alerts ─────────────────
    what_changed TEXT[],                     -- Array of specific changes
    recommended_actions TEXT[],              -- Array of action items
    affected_product_categories TEXT[],      -- Product categories for cross-referencing

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amendments_standard ON amendments(standard_number);
CREATE INDEX IF NOT EXISTS idx_amendments_severity ON amendments(severity);
CREATE INDEX IF NOT EXISTS idx_amendments_published ON amendments(published_date DESC);

-- GIN index for array containment queries (find amendments by category)
CREATE INDEX IF NOT EXISTS idx_amendments_categories ON amendments USING GIN (affected_product_categories);

-- ─── RLS ─────────────────────────────────────────────
ALTER TABLE amendments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Amendments are readable by all"
    ON amendments FOR SELECT
    USING (true);

CREATE POLICY "Amendments can be inserted by service role"
    ON amendments FOR INSERT
    WITH CHECK (true);

-- ─── Seed demo amendments ────────────────────────────

INSERT INTO amendments (standard_number, title, impact_summary, affected_clause, severity, published_date, what_changed, recommended_actions, affected_product_categories)
VALUES
(
    'IS 302-2-15 [DEMO]',
    '[SIMULATED] Amendment No. 3 — Updated Thermal Cut-out Requirements',
    'A simulated amendment affects the thermal cut-out testing requirements. The test duration for abnormal operation (Clause 19) may need to be extended from 30 minutes to 60 minutes.',
    'Clause 19 [DEMO]',
    'REVIEW_RECOMMENDED',
    '2026-07-15',
    ARRAY['Thermal cut-out test duration increased from 30 minutes to 60 minutes', 'New requirement for dual thermal protection system in heating appliances', 'Updated temperature limits for safety cut-off from 95°C to 90°C'],
    ARRAY['Review your existing test report for Clause 19 (Abnormal Operation)', 'Contact your BIS-recognized testing laboratory about re-testing under the new 60-minute protocol', 'Update your Bill of Materials if your thermal cut-out component has changed', 'Plan for re-certification if your current licence expires within 6 months'],
    ARRAY['Domestic Electric Appliances']
),
(
    'IS 302-2-15 [DEMO]',
    '[SIMULATED] Corrigendum — Updated Marking Requirements',
    'A simulated update to marking requirements. Energy efficiency rating marking may need to be added to product labels in addition to existing ISI marking.',
    'Clause 7.1 [DEMO]',
    'POTENTIAL_IMPACT',
    '2026-08-01',
    ARRAY['Energy efficiency rating (star label) now mandatory on product packaging', 'QR code linking to BIS certificate details required on product label', 'Font size for safety warnings increased from 6pt to 8pt minimum'],
    ARRAY['Update your product labels and packaging to include the energy efficiency star rating', 'Generate a QR code linked to your BIS certificate and add it to product labels', 'Review all safety warning text on product and packaging for minimum 8pt font compliance'],
    ARRAY['Domestic Electric Appliances']
),
(
    'IS 2062 [DEMO]',
    '[SIMULATED] Revised Chemical Composition Limits',
    'A simulated revision to the phosphorus and sulphur content limits for Grade E250A. Maximum sulphur content may be reduced from 0.045% to 0.040%.',
    'Clause 5 [DEMO]',
    'POTENTIAL_IMPACT',
    '2026-06-20',
    ARRAY['Maximum sulphur content reduced from 0.045% to 0.040% for Grade E250A', 'New phosphorus limit of 0.035% (previously 0.040%)', 'Additional requirement for micro-alloy composition declaration'],
    ARRAY['Get your raw material supplier to confirm compliance with the new composition limits', 'Request updated Mill Test Certificates from your steel supplier', 'Arrange for fresh chemical analysis testing if your current certificates are older than 6 months', 'Update your Quality Control Plan to reflect the new composition limits'],
    ARRAY['Steel Products']
),
(
    'IS 9873 [DEMO]',
    '[SIMULATED] New Toy Safety Requirements — Migration from Lead Paint',
    'New requirements for elimination of lead-based paint in children''s toys. Stricter limits on heavy metal content in surface coatings.',
    'Clause 4.2 [DEMO]',
    'REVIEW_RECOMMENDED',
    '2026-08-15',
    ARRAY['Total lead content in surface coatings reduced from 90 ppm to 25 ppm', 'New testing requirement for cadmium, chromium, and mercury in toy materials', 'Mandatory third-party lab certification for paint and coating materials'],
    ARRAY['Immediately audit all paint and coating suppliers for lead content compliance', 'Schedule heavy metal content testing at a BIS-recognized laboratory', 'Source alternative lead-free coating materials if current ones exceed 25 ppm', 'Update your product documentation with new test certificates'],
    ARRAY['Textiles', 'Electronics']
);
