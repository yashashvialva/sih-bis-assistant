/**
 * ⚠️ DEMO DATA — NOT ACTUAL BIS REQUIREMENTS
 * 
 * This file contains CLEARLY LABELED synthetic/demo records for
 * UI development purposes ONLY. These are NOT real BIS standards,
 * clauses, or requirements.
 * 
 * Real BIS seed data will be provided by the user and ingested
 * through the proper ingestion pipeline before production use.
 * 
 * DO NOT present this data as actual BIS requirements.
 */

import type { BISStandard, BISChunk, Laboratory, LicenseRecord, SimulatedAmendment } from '@/lib/types';

// ─── Demo BIS Standards ──────────────────────────────────────

export const DEMO_STANDARDS: BISStandard[] = [
  {
    id: 'demo-std-001',
    standardNumber: 'IS 302-2-15 [DEMO]',
    title: '[DEMO] Safety of Household and Similar Electrical Appliances — Particular Requirements for Appliances for Heating Liquids',
    productCategory: 'Domestic Electric Appliances',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-std-002',
    standardNumber: 'IS 2062 [DEMO]',
    title: '[DEMO] Hot Rolled Low and Medium Tensile Structural Steel — Specification',
    productCategory: 'Steel Products',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
];

// ─── Demo BIS Chunks (Clause-level content) ──────────────────

export const DEMO_CHUNKS: BISChunk[] = [
  // Electric Kettle chunks
  {
    id: 'demo-chunk-001',
    standardId: 'demo-std-001',
    standardNumber: 'IS 302-2-15 [DEMO]',
    clause: 'Clause 7.1 [DEMO]',
    sectionTitle: 'Marking and Instructions',
    content: '[DEMO DATA] Appliances shall be marked with rated voltage, rated power input, manufacturer name or trademark, model reference, and the ISI mark where applicable. Instructions for use shall be provided with each appliance.',
    metadata: { requirementType: 'Marking', mandatory: true, isDemo: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-chunk-002',
    standardId: 'demo-std-001',
    standardNumber: 'IS 302-2-15 [DEMO]',
    clause: 'Clause 13.3 [DEMO]',
    sectionTitle: 'Electric Strength',
    content: '[DEMO DATA] The insulation of the appliance shall withstand the electric strength test. For Class I appliances, a voltage of 1500V AC shall be applied between live parts and accessible metal parts for 1 minute without breakdown.',
    metadata: { requirementType: 'Testing', testName: 'High Voltage Test', mandatory: true, isDemo: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-chunk-003',
    standardId: 'demo-std-001',
    standardNumber: 'IS 302-2-15 [DEMO]',
    clause: 'Clause 19 [DEMO]',
    sectionTitle: 'Abnormal Operation',
    content: '[DEMO DATA] Appliances shall be constructed so that the risk of fire or electric shock from abnormal or careless operation is minimized. Thermal cut-out devices shall be provided and shall operate reliably under fault conditions.',
    metadata: { requirementType: 'Safety', mandatory: true, isDemo: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-chunk-004',
    standardId: 'demo-std-001',
    standardNumber: 'IS 302-2-15 [DEMO]',
    clause: 'Clause 27.5 [DEMO]',
    sectionTitle: 'Provision for Earthing',
    content: '[DEMO DATA] For Class I appliances, the earthing continuity shall be verified. The resistance between the earthing terminal and any accessible metal part shall not exceed 0.1 ohm when measured with a current of not less than 10A.',
    metadata: { requirementType: 'Testing', testName: 'Earth Resistance Test', mandatory: true, isDemo: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-chunk-005',
    standardId: 'demo-std-001',
    standardNumber: 'IS 302-2-15 [DEMO]',
    clause: 'Clause 24 [DEMO]',
    sectionTitle: 'Components',
    content: '[DEMO DATA] Safety-critical components including thermostats, thermal cut-outs, and supply cords shall conform to the relevant Indian Standards. A Bill of Materials listing all safety-critical components with their ISI mark details shall be maintained.',
    metadata: { requirementType: 'Documentation', docRequired: 'Bill of Materials', mandatory: true, isDemo: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-chunk-006',
    standardId: 'demo-std-001',
    standardNumber: 'IS 302-2-15 [DEMO]',
    clause: 'Schedule II [DEMO]',
    sectionTitle: 'Scheme of Testing and Inspection',
    content: '[DEMO DATA] The certification follows BIS Scheme-I (ISI Mark). Required documents include: Factory Test Certificate, Calibration Records, Bill of Materials with safety-critical components, Process Flow Chart, and Quality Control Plan.',
    metadata: { requirementType: 'Certification', scheme: 'Scheme-I', isDemo: true },
    createdAt: new Date().toISOString(),
  },
  // Steel Product chunks
  {
    id: 'demo-chunk-007',
    standardId: 'demo-std-002',
    standardNumber: 'IS 2062 [DEMO]',
    clause: 'Clause 5 [DEMO]',
    sectionTitle: 'Chemical Composition',
    content: '[DEMO DATA] The chemical composition of the steel shall conform to the requirements specified in Table 1. The carbon content for Grade E250A shall not exceed 0.23 percent and manganese content shall be in the range of 0.80 to 1.50 percent.',
    metadata: { requirementType: 'Material', grade: 'E250A', mandatory: true, isDemo: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-chunk-008',
    standardId: 'demo-std-002',
    standardNumber: 'IS 2062 [DEMO]',
    clause: 'Clause 9 [DEMO]',
    sectionTitle: 'Mechanical Properties',
    content: '[DEMO DATA] The tensile strength for Grade E250A shall be in the range of 410 to 540 MPa. The minimum yield stress shall be 250 MPa for thickness up to and including 20 mm.',
    metadata: { requirementType: 'Testing', testName: 'Tensile Test', mandatory: true, isDemo: true },
    createdAt: new Date().toISOString(),
  },
];

// ─── Demo Laboratories (Tier 3 — Static) ─────────────────────

export const DEMO_LABS: Laboratory[] = [
  {
    id: 'demo-lab-001',
    name: 'ERTL (East), Kolkata [DEMO]',
    location: 'DN Block, Sector V, Salt Lake City',
    city: 'Kolkata',
    state: 'West Bengal',
    productCategories: ['Domestic Electric Appliances', 'Electronics'],
    testingCapabilities: ['High Voltage Test', 'Earth Resistance Test', 'Temperature Rise Test'],
    isDemo: true,
  },
  {
    id: 'demo-lab-002',
    name: 'ERTL (South), Bangalore [DEMO]',
    location: 'CSIR Road, Taramani',
    city: 'Bangalore',
    state: 'Karnataka',
    productCategories: ['Domestic Electric Appliances', 'IT Equipment', 'Lighting'],
    testingCapabilities: ['High Voltage Test', 'Earth Resistance Test', 'EMC Testing', 'Safety Testing'],
    isDemo: true,
  },
  {
    id: 'demo-lab-003',
    name: 'NABL Accredited Lab, Delhi [DEMO]',
    location: 'Okhla Industrial Area, Phase III',
    city: 'New Delhi',
    state: 'Delhi',
    productCategories: ['Steel Products', 'Construction Materials', 'Domestic Electric Appliances'],
    testingCapabilities: ['Chemical Analysis', 'Tensile Test', 'Impact Test', 'High Voltage Test'],
    isDemo: true,
  },
  {
    id: 'demo-lab-004',
    name: 'TUV SUD South Asia, Mumbai [DEMO]',
    location: 'Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    productCategories: ['Domestic Electric Appliances', 'Automotive', 'Medical Devices'],
    testingCapabilities: ['Safety Testing', 'Performance Testing', 'EMC Testing', 'Environmental Testing'],
    isDemo: true,
  },
  {
    id: 'demo-lab-005',
    name: 'CPRI, Bangalore [DEMO]',
    location: 'Professor Sir C.V. Raman Road, Sadashivanagar',
    city: 'Bangalore',
    state: 'Karnataka',
    productCategories: ['Electrical Equipment', 'Power Transformers', 'Switchgear'],
    testingCapabilities: ['High Voltage Test', 'Short Circuit Test', 'Temperature Rise Test'],
    isDemo: true,
  },
];

// ─── Demo License Records (Tier 3 — Static) ──────────────────

export const DEMO_LICENSES: LicenseRecord[] = [
  {
    licenseNumber: 'CM/L-1234567 [DEMO]',
    productName: 'Electric Kettle — Model EK2000',
    manufacturer: 'Demo Appliances Pvt. Ltd.',
    standardNumber: 'IS 302-2-15 [DEMO]',
    validUntil: '2027-03-31',
    isDemo: true,
  },
  {
    licenseNumber: 'CM/L-7654321 [DEMO]',
    productName: 'Structural Steel Plate — Grade E250A',
    manufacturer: 'Demo Steel Industries',
    standardNumber: 'IS 2062 [DEMO]',
    validUntil: '2026-12-31',
    isDemo: true,
  },
  {
    licenseNumber: 'R-9988776 [DEMO]',
    productName: 'Electric Iron — Model DI500',
    manufacturer: 'Demo Home Products',
    standardNumber: 'IS 302-2-3 [DEMO]',
    validUntil: '2027-06-30',
    isDemo: true,
  },
];

export const DEMO_AMENDMENTS: SimulatedAmendment[] = [];

// ─── Product Categories ─────────────────────────────────────

export const PRODUCT_CATEGORIES = [
  'Domestic Electric Appliances',
  'Steel Products',
  'Electronics',
  'Food Products',
  'Construction Materials',
  'Automotive Components',
  'Textiles',
  'Chemicals',
  'Medical Devices',
  'Solar Equipment',
] as const;
