# BIS Compliance Assistant — Complete Project Documentation

> **SIH Problem Statement:** 26107  
> **Project Name:** `bis-app`  
> **Framework:** Next.js 16.3.3 (App Router) + React 19 + TypeScript 5  
> **Styling:** Tailwind CSS v4 + extensive custom vanilla CSS design system  
> **Database (planned):** Supabase (PostgreSQL + pgvector)  
> **Testing:** Vitest 4 + React Testing Library  
> **Icons:** Lucide React  
> **Date of Documentation:** 2026-08-29  

---

## Table of Contents

1. [What Is This Project?](#1-what-is-this-project)
2. [Why Was It Built? (Problem Statement)](#2-why-was-it-built)
3. [Core Architectural Principle — The Trust Layer](#3-core-architectural-principle--the-trust-layer)
4. [Technology Stack](#4-technology-stack)
5. [Complete File Structure](#5-complete-file-structure)
6. [Feature Tier System](#6-feature-tier-system)
7. [Detailed Feature Breakdown & Flow](#7-detailed-feature-breakdown--flow)
   - 7.1 Landing Page
   - 7.2 BIS Assistant (Q&A Chatbot)
   - 7.3 Product Workspace & Compliance Roadmap
   - 7.4 Document Checker
   - 7.5 Lab Directory
   - 7.6 Consumer Verification
   - 7.7 Amendment Monitor
8. [Data Layer — How Data Works](#8-data-layer--how-data-works)
   - 8.1 Mock/Seed Data
   - 8.2 RAG Vector Search
   - 8.3 Workspace Store (localStorage)
   - 8.4 Supabase (Database Schema — Ready but Unused)
9. [Internationalization (i18n)](#9-internationalization-i18n)
10. [Design System](#10-design-system)
11. [Testing](#11-testing)
12. [What Is DONE](#12-what-is-done)
13. [What Is REMAINING / NOT YET IMPLEMENTED](#13-what-is-remaining--not-yet-implemented)
14. [How to Run](#14-how-to-run)
15. [Architecture Diagram](#15-architecture-diagram)

---

## 1. What Is This Project?

This is an **AI-powered compliance assistant** built for **Indian manufacturers and MSMEs (Micro, Small & Medium Enterprises)** who need to navigate the **Bureau of Indian Standards (BIS)** certification process. 

The application helps users:
- Ask natural-language questions about BIS standards and get sourced answers
- Create product profiles and get auto-generated compliance roadmaps
- Upload documents for AI-assisted compliance review
- Browse testing laboratories
- Verify licence/registration numbers
- Monitor standard amendments (simulated)

**Critical design constraint:** The system NEVER declares compliance status. It NEVER says "you are compliant" or "you are certified." That authority belongs ONLY to BIS-recognized certifying bodies. Every AI-generated claim is classified into one of three trust states (see Section 3).

---

## 2. Why Was It Built?

This project is built for **Smart India Hackathon (SIH) 2026**, specifically for **Problem Statement 26107**.

The problem: Indian manufacturers, especially MSMEs, struggle with:
- Understanding which BIS standards apply to their products
- Navigating the multi-step certification process (ISI Mark, BIS Registration)
- Knowing what tests are required and which labs to use
- Tracking amendments to standards that affect their products

This application provides an **intelligent compliance workflow layer** — not just a search engine — that guides manufacturers through the entire BIS certification journey with AI assistance.

---

## 3. Core Architectural Principle — The Trust Layer

This is the **most important architectural decision** in the entire project. Every single AI-generated compliance-related claim in the application is categorized into exactly **one of three trust states:**

| Trust State | Visual Indicator | Meaning |
|---|---|---|
| `VERIFIED_BIS_DATA` | 🟢 Green badge — "Verified against BIS data" | Information retrieved **directly** from the curated BIS corpus. Has exact source references (standard number, clause, evidence text). |
| `AI_INTERPRETATION` | 🟡 Amber badge — "AI Interpretation — Non-binding guidance" | AI-generated reasoning/synthesis based on available sources. Explicitly labeled as NOT an official BIS determination. |
| `NO_MATCHING_SOURCE` | ⚪ Slate badge — "No Authoritative Source Found" | No matching data found in the corpus. Does NOT claim the requirement doesn't exist. Directs user to consult BIS directly. |

**Why this matters:** In regulatory compliance, a wrong "verified" claim could lead a manufacturer to skip a critical safety test. A false "non-compliant" could cause unnecessary business disruption. The trust layer ensures:
1. No claim is ever presented without its confidence classification
2. No hallucinated citations are ever shown
3. The system explicitly admits when it doesn't know
4. The `<SourcedClaim />` component is the SINGLE reusable component enforcing this across the entire UI

The **`<SourcedClaim />`** component (`src/components/trust/SourcedClaim.tsx`) is used on:
- The BIS Assistant chatbot responses
- The compliance roadmap steps
- The document review results
- The consumer verification results

The **`<PersistentSafetyFooter />`** component (`src/components/trust/PersistentSafetyFooter.tsx`) displays a non-dismissible warning on document review screens reminding users that final compliance is determined only by BIS-recognized certifying bodies.

### TypeScript Type Enforcement

The trust layer is enforced at the type level in `src/lib/types.ts`:

```typescript
export type ConfidenceLevel =
  | 'VERIFIED_BIS_DATA'
  | 'AI_INTERPRETATION'
  | 'NO_MATCHING_SOURCE';

export interface SourcedClaimData {
  id: string;
  content: string;
  confidenceLevel: ConfidenceLevel;  // REQUIRED
  sources: SourceReference[];         // Empty for NO_MATCHING_SOURCE
  reasoning?: string;                 // Only for AI_INTERPRETATION
}
```

---

## 4. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.3.3 | Server/client-side rendering, routing |
| UI Library | React | 19.2.8 | Component-based UI |
| Language | TypeScript | ^5 | Type safety |
| Styling | Tailwind CSS + Custom CSS | v4 | Design system with CSS custom properties |
| Icons | Lucide React | ^1.34.0 | Consistent iconography |
| Database (planned) | Supabase (PostgreSQL + pgvector) | ^2.112.4 | Persistence + vector similarity search |
| Testing | Vitest + React Testing Library | ^4.1.11 | Unit + component tests |
| Linting | ESLint | ^9 | Code quality |

---

## 5. Complete File Structure

```
SIH_2026/
├── src/
│   ├── app/                              # Next.js App Router pages
│   │   ├── layout.tsx                    # Root layout (metadata, providers)
│   │   ├── page.tsx                      # Landing page (/)
│   │   ├── providers.tsx                 # Client-side providers (i18n, header, footer)
│   │   ├── globals.css                   # Full design system (451 lines)
│   │   ├── favicon.ico
│   │   ├── assistant/
│   │   │   └── page.tsx                  # BIS Q&A chatbot (/assistant)
│   │   ├── products/
│   │   │   ├── page.tsx                  # Product list (/products)
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # Product workspace (/products/:id)
│   │   │       ├── roadmap/
│   │   │       │   └── page.tsx          # Roadmap detail view (/products/:id/roadmap)
│   │   │       └── documents/
│   │   │           └── page.tsx          # Document checker (/products/:id/documents)
│   │   ├── labs/
│   │   │   └── page.tsx                  # Lab directory (/labs)
│   │   ├── verify/
│   │   │   └── page.tsx                  # Consumer verification (/verify)
│   │   └── alerts/
│   │       └── page.tsx                  # Amendment monitor (/alerts)
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.tsx                # Global navigation header
│   │   └── trust/
│   │       ├── SourcedClaim.tsx           # THE trust layer component (289 lines)
│   │       └── PersistentSafetyFooter.tsx # Non-dismissible safety notice
│   └── lib/
│       ├── types.ts                      # All TypeScript interfaces (176 lines)
│       ├── db/
│       │   ├── schema.sql                # Full PostgreSQL + pgvector schema (210 lines)
│       │   └── supabaseClient.ts         # Supabase client with fallback
│       ├── i18n/
│       │   ├── dictionaries.ts           # EN + HI translations (176 lines)
│       │   └── useTranslation.tsx        # React Context-based i18n hook
│       ├── mock-data/
│       │   └── seedData.ts               # Demo BIS standards, chunks, labs, licenses (254 lines)
│       ├── rag/
│       │   └── vectorStore.ts            # Mock keyword-based search (131 lines)
│       └── workspace/
│           └── store.ts                  # localStorage-based product/roadmap CRUD (321 lines)
├── tests/
│   ├── setup.ts                          # Test setup (jest-dom matchers)
│   ├── ragRetrieval.test.ts              # RAG search tests (118 lines)
│   ├── trustConstraint.test.tsx          # Trust layer component tests (146 lines)
│   ├── verification.test.ts             # Consumer verification tests (61 lines)
│   └── workspaceProgress.test.ts        # Workspace CRUD + progress tests (201 lines)
├── public/                               # Static assets (SVGs)
├── package.json
├── vitest.config.ts
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
└── postcss.config.mjs
```

---

## 6. Feature Tier System

The project organizes features into three tiers:

| Tier | Status | Features |
|---|---|---|
| **Tier 1** (Core) | ✅ Implemented with full UI | BIS Assistant Q&A, Compliance Roadmap/Workspace, Product Management |
| **Tier 2** (Advanced) | ✅ UI Built, but uses demo logic | Document Checker (AI-assisted review) |
| **Tier 3** (Supplementary) | ✅ UI Built with static demo data | Lab Directory, Consumer Verification, Amendment Monitor |

---

## 7. Detailed Feature Breakdown & Flow

### 7.1 Landing Page (`/`)

**File:** `src/app/page.tsx`

**What it does:**
- Hero section with gradient background, "SIH Problem Statement 26107" badge
- "Built on Trust & Transparency" section showing three principles: Source-First, Transparent AI, No Fake Certainty
- Feature cards grid showing all 6 features with tier labels
- Two CTAs: "Ask the BIS Assistant" → `/assistant`, "Get Started" → `/products`

**Flow:** User lands here → sees features → navigates to any module.

### 7.2 BIS Assistant — Q&A Chatbot (`/assistant`)

**File:** `src/app/assistant/page.tsx`

**How it works (step by step):**
1. User types a natural-language question about BIS standards (e.g., "What tests are needed for electrical appliance certification?")
2. On submit, the query goes through the **RAG pipeline** (currently mock):
   - `searchCorpus(query)` — keyword-based search against `DEMO_CHUNKS` (8 demo chunks from 2 standards)
   - Each chunk gets a relevance score based on keyword matching
   - Results filtered to score > 0.15 and sorted by score
3. `buildSourcedClaims(query, searchResults)` classifies each result:
   - Score > 0.5 → `VERIFIED_BIS_DATA`
   - Score 0.15–0.5 → `AI_INTERPRETATION`
   - No results → `NO_MATCHING_SOURCE` (a single claim saying "no data found")
4. Each claim is rendered using `<SourcedClaim />` with expandable source references
5. Example queries are shown when chat is empty for easy onboarding

**Data flow:**
```
User query → searchCorpus() → keyword matching against DEMO_CHUNKS → score → buildSourcedClaims() → SourcedClaimData[] → <SourcedClaim /> render
```

**Current limitation:** Uses simple keyword matching, NOT actual vector embeddings. The real implementation would use pgvector cosine similarity with 768-dimension embeddings.

### 7.3 Product Workspace & Compliance Roadmap

**Files:**
- `src/app/products/page.tsx` — Product list
- `src/app/products/[id]/page.tsx` — Product workspace
- `src/app/products/[id]/roadmap/page.tsx` — Detailed roadmap view
- `src/lib/workspace/store.ts` — localStorage CRUD

**How it works (step by step):**
1. User creates a product by entering: name, description, and product category (from predefined list of 10 categories like "Domestic Electric Appliances", "Steel Products", etc.)
2. Product is saved to `localStorage` under key `bis-workspace`
3. User navigates to the product workspace (`/products/:id`)
4. User clicks "Generate Roadmap" which:
   - Matches product category to a `DEMO_STANDARDS` entry
   - Finds all `DEMO_CHUNKS` for that standard
   - Creates a structured roadmap with steps:
     1. **Standard Identification** — which BIS standard applies (VERIFIED or NO_MATCHING_SOURCE)
     2. **Certification Requirement** — scheme details from corpus (VERIFIED or NO_MATCHING_SOURCE)
     3. **Testing Steps** — one per testing chunk from the standard (VERIFIED)
     4. **Documentation** — required documents (VERIFIED or NO_MATCHING_SOURCE)
     5. **Lab Selection** — guidance to find a lab (AI_INTERPRETATION)
     6. **Application** — submit to BIS (AI_INTERPRETATION)
     7. **Final Review** — grant of licence by BIS (AI_INTERPRETATION)
   - Each step has a `confidenceLevel` and optional `sourceClause`
5. User can toggle steps as COMPLETED via checkbox-like UI
6. Progress bar updates automatically based on completed/total steps
7. Detailed roadmap view (`/products/:id/roadmap`) shows vertical timeline with expandable steps, each rendering through `<SourcedClaim />`

**Data flow:**
```
Create Product → localStorage → Generate Roadmap → match DEMO_STANDARDS → find DEMO_CHUNKS → create steps with trust classification → persist in localStorage → render with SourcedClaim + progress bar
```

### 7.4 Document Checker (`/products/:id/documents`)

**File:** `src/app/products/[id]/documents/page.tsx`

**How it works:**
1. User uploads a text/PDF file (drag-and-drop or file browser)
2. File text is extracted client-side via `File.text()`
3. User clicks "Analyze Document"
4. The system compares uploaded document text against roadmap step requirements:
   - Extracts keywords from each roadmap step's description
   - Checks how many keywords appear in the uploaded document
   - Classifies as:
     - `LIKELY_ADDRESSED` (>30% keyword match)
     - `POTENTIALLY_INCOMPLETE` (10-30% match)
     - `NO_MATCHING_EVIDENCE` (<10% match)
5. Results rendered via `<SourcedClaim />` with `AI_INTERPRETATION` confidence
6. `<PersistentSafetyFooter />` displayed at top AND bottom

**Current limitation:** Uses basic keyword matching. Does not do actual NLP/semantic analysis. PDF parsing is limited to `File.text()` which only works for text files, not actual PDF binary parsing.

### 7.5 Lab Directory (`/labs`)

**File:** `src/app/labs/page.tsx`

**How it works:**
- Displays 5 demo laboratory records (hardcoded in `seedData.ts`)
- Labs include: ERTL (East), ERTL (South), NABL Delhi, TUV SUD Mumbai, CPRI Bangalore
- Each lab shows: name, location, product categories, testing capabilities
- Filterable by state (West Bengal, Karnataka, Delhi, Maharashtra) and product category
- All labs are explicitly marked with "Demo Data" badge
- Demo notice banner at top

**Data:** Static, from `DEMO_LABS` array in `seedData.ts`. No API calls.

### 7.6 Consumer Verification (`/verify`)

**File:** `src/app/verify/page.tsx`

**How it works:**
1. User enters a licence/registration number
2. System searches `DEMO_LICENSES` array (3 demo records)
3. If found: Shows match via `<SourcedClaim />` with `VERIFIED_BIS_DATA`, plus record details (licence number, product, manufacturer, standard, validity)
4. If NOT found: Shows `<SourcedClaim />` with `NO_MATCHING_SOURCE` + important disclaimer: "This does not confirm that the product or licence is invalid. Verify directly with BIS."
5. Links to official BIS website for real verification

**Demo records:**
- `CM/L-1234567 [DEMO]` — Electric Kettle
- `CM/L-7654321 [DEMO]` — Structural Steel Plate
- `R-9988776 [DEMO]` — Electric Iron

### 7.7 Amendment Monitor (`/alerts`)

**File:** `src/app/alerts/page.tsx`

**How it works:**
- Displays 3 simulated amendment alerts (hardcoded)
- Each alert has: title, standard number, impact summary, affected clause, severity, published date
- Severity levels with color coding:
  - `REVIEW_RECOMMENDED` (amber)
  - `POTENTIAL_IMPACT` (slate)
  - `INFORMATION_ONLY` (neutral)
- Every alert card includes a non-dismissible reminder: "This is a simulated alert for demonstration purposes."
- Demo notice banner at top

**Data:** Static, from `DEMO_AMENDMENTS` array. No live feed or API.

---

## 8. Data Layer — How Data Works

### 8.1 Mock/Seed Data (`src/lib/mock-data/seedData.ts`)

All data in the current prototype is **demo/synthetic data**. Every single record is clearly labeled with `[DEMO]` in its name/number and has an `isDemo: true` flag.

| Data Type | Count | Examples |
|---|---|---|
| BIS Standards | 2 | IS 302-2-15 (Electric Appliances), IS 2062 (Steel) |
| BIS Chunks (clauses) | 8 | Marking, Electric Strength, Abnormal Operation, Earthing, Components, Certification Scheme, Chemical Composition, Mechanical Properties |
| Laboratories | 5 | ERTL East/South, NABL Delhi, TUV SUD Mumbai, CPRI Bangalore |
| License Records | 3 | Electric Kettle, Steel Plate, Electric Iron |
| Simulated Amendments | 3 | Thermal cut-out update, Marking update, Chemical composition revision |
| Product Categories | 10 | Domestic Electric Appliances, Steel Products, Electronics, Food Products, etc. |

### 8.2 RAG Vector Search (`src/lib/rag/vectorStore.ts`)

Currently uses **simple keyword matching** as a stand-in for semantic similarity:

```
searchCorpus(query):
  1. Split query into terms (>2 chars)
  2. For each DEMO_CHUNK, count matching terms in content+title+clause+standard
  3. Boost for clause/title matches
  4. Normalize score by query term count
  5. Filter score > 0.15
  6. Sort by score descending
  7. Return top K results
```

**Production plan:** Replace with pgvector cosine similarity using 768-dimension embeddings stored in Supabase:
```sql
-- The schema already has this function defined:
CREATE OR REPLACE FUNCTION match_bis_chunks(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.70,
    match_count INT DEFAULT 5
) RETURNS TABLE (...)
```

### 8.3 Workspace Store (`src/lib/workspace/store.ts`)

Client-side persistence using `localStorage`:
- Key: `bis-workspace`
- Stores: `{ products: Product[], roadmaps: Roadmap[], roadmapSteps: RoadmapStep[] }`
- Re-reads from localStorage on every operation (avoids stale state)
- CRUD operations: `createProduct`, `deleteProduct`, `getProduct(s)`, `generateRoadmap`, `updateStepStatus`, `calculateCompletion`

### 8.4 Supabase Database Schema (`src/lib/db/schema.sql`)

A complete PostgreSQL schema is defined and ready to deploy but is **NOT currently connected**:

**Tables:**
1. `bis_standards` — BIS standard metadata (number, title, category, status)
2. `bis_chunks` — Clause-level content chunks with `VECTOR(768)` embedding column + IVFFlat index
3. `products` — User products (linked to user_id via RLS)
4. `roadmaps` — One per product, tracks completion percentage
5. `roadmap_steps` — Individual certification steps with source references and confidence levels
6. `uploaded_documents` — User-uploaded compliance documents
7. `compliance_evidence` — AI-generated evidence assessments per document
8. `simulated_amendments` — Standard amendment alerts

**Security:** Row Level Security (RLS) is configured so users can only access their own products, roadmaps, steps, and documents. BIS corpus data (standards + chunks) is read-only for all authenticated users.

**Supabase Client (`src/lib/db/supabaseClient.ts`):** Creates client only if `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars are set. Falls back to mock data otherwise (which is the current behavior).

---

## 9. Internationalization (i18n)

**Files:** `src/lib/i18n/dictionaries.ts`, `src/lib/i18n/useTranslation.tsx`

- Supports **English (en)** and **Hindi (hi)**
- Uses React Context (`LanguageProvider`) wrapping the entire app
- Language toggle button in the header (Globe icon)
- ~85 translation keys covering all UI strings (navigation, landing, assistant, products, roadmap, document checker, labs, verification, alerts, general)
- Architecture: Core reasoning stays in English, only final rendered strings are translated
- Fallback: if a Hindi key is missing, falls back to English

---

## 10. Design System

**File:** `src/app/globals.css` (451 lines)

A comprehensive custom design system built on CSS custom properties:

**Color Palette:**
- **Primary:** Deep Navy/Indigo (9 shades from `#eef2ff` to `#312e81`)
- **Verified (Trust):** Emerald green
- **Interpretation (Trust):** Amber
- **No Source (Trust):** Slate
- **Safety/Warning:** Amber background with dark text
- **Surfaces:** White/dark with elevated and overlay variants
- **Dark mode:** Supported via `.dark` class (variables swap automatically)

**Components (CSS):**
- `.glass-card` — Glassmorphism card with backdrop blur
- `.card` — Standard content card with border and shadow
- `.btn` / `.btn-primary` / `.btn-secondary` / `.btn-ghost` — Button variants
- `.input` — Form input styling with focus ring
- `.badge` / `.badge-verified` / `.badge-interpretation` / `.badge-nosource` — Trust level badges
- `.progress-bar` / `.progress-bar-fill` — Animated progress bar
- `.safety-footer` — Amber warning banner
- `.trust-card` / `.trust-card-verified` / `.trust-card-interpretation` / `.trust-card-nosource` — Trust-colored containers
- `.skeleton` — Loading skeleton with shimmer animation

**Animations:**
- `fadeIn` — Fade in with slight upward movement
- `slideInRight` — Slide in from right
- `pulse-soft` — Subtle opacity pulse
- `shimmer` — Loading skeleton shimmer
- `progress-fill` — Progress bar fill animation
- `float` — Gentle floating effect (decorative blobs)
- `.stagger-children` — Staggered animation for lists (up to 8 children)

**Layout:** Global header is sticky with glassmorphism (backdrop blur). Footer has disclaimer text.

---

## 11. Testing

**Framework:** Vitest 4 + React Testing Library + jsdom  
**Config:** `vitest.config.ts` — uses `@vitejs/plugin-react`, jsdom environment, `@` path alias

### Test Suites (4 files, all in `tests/`):

#### `ragRetrieval.test.ts` (8 tests)
- ✅ Retrieves relevant chunks for known queries
- ✅ Preserves source metadata (standard number, clause)
- ✅ Returns empty array for unrelated queries (no hallucination)
- ✅ Does not fabricate citations for unmatched queries
- ✅ Finds matching standard for known product categories
- ✅ Returns null for unknown products
- ✅ Returns `NO_MATCHING_SOURCE` when no results
- ✅ Never produces compliance-asserting language ("You are compliant")

#### `trustConstraint.test.tsx` (7 tests)
- ✅ Renders `VERIFIED_BIS_DATA` with standard number, clause, evidence
- ✅ Renders `AI_INTERPRETATION` with non-binding disclaimer
- ✅ Renders `NO_MATCHING_SOURCE` with explicit uncertainty
- ✅ Never uses compliance-asserting language
- ✅ ConfidenceTag renders correct badge for each level
- ✅ PersistentSafetyFooter renders required safety message
- ✅ PersistentSafetyFooter is always visible (not hidden)

#### `verification.test.ts` (4 tests)
- ✅ Finds matching demo licence record
- ✅ Returns no match for unknown numbers
- ✅ Demo data is always marked as `isDemo`
- ✅ No-match scenario never implies invalidity (doesn't say "fake", "fraudulent", "counterfeit")

#### `workspaceProgress.test.ts` (7 tests)
- ✅ Creates and retrieves products
- ✅ Lists all products
- ✅ Deletes products and cascades to roadmaps
- ✅ Generates roadmap with sourced steps
- ✅ Non-sourced steps classified as AI_INTERPRETATION or NO_MATCHING_SOURCE
- ✅ Completion percentage calculates correctly (0% → partial → 100%)
- ✅ Step status persists and toggles correctly

---

## 12. What Is DONE ✅

### Fully Implemented
- [x] **Complete Next.js 16 app** with App Router, all routes working
- [x] **Trust Layer architecture** — `ConfidenceLevel` type system, `SourcedClaim` component, `PersistentSafetyFooter`
- [x] **Landing page** with hero, principles, feature cards
- [x] **BIS Assistant chatbot** with RAG pipeline (mock keyword search), sourced claims rendering
- [x] **Product management** — create, list, delete, detail views (localStorage persistence)
- [x] **Roadmap generation** — auto-generates multi-step compliance roadmap from product category
- [x] **Roadmap detail view** — vertical timeline with expandable sourced claims
- [x] **Compliance checklist** — interactive checkbox UI with progress tracking
- [x] **Document checker** — file upload (drag-and-drop), text extraction, keyword-based compliance review
- [x] **Lab directory** — filterable by location and category with demo data
- [x] **Consumer verification** — licence number lookup with appropriate match/no-match handling
- [x] **Amendment monitor** — severity-coded alert cards with safe wording
- [x] **Internationalization** — English + Hindi with language toggle
- [x] **Responsive design** — mobile navigation, responsive grids
- [x] **Full design system** — CSS custom properties, glassmorphism, animations, dark mode variables
- [x] **Global header** — sticky, glassmorphism, responsive, language toggle, active route highlighting
- [x] **Global footer** — SIH disclaimer
- [x] **26 unit/integration tests** across 4 test files
- [x] **Database schema** — complete SQL schema for Supabase + pgvector (ready to deploy)
- [x] **Supabase client** with graceful fallback for offline/unconfigured mode
- [x] **Demo data** — 2 standards, 8 chunks, 5 labs, 3 licences, 3 amendments, 10 product categories

---

## 13. What Is REMAINING / NOT YET IMPLEMENTED ❌

### Critical (Must-Have for Production)

| # | Feature | Current State | What's Needed |
|---|---|---|---|
| 1 | **Real BIS Data Ingestion** | Uses 8 synthetic chunks from 2 demo standards | Need to scrape/collect real BIS standards, chunk them into clauses, and ingest into Supabase `bis_chunks` table. Hundreds of standards and thousands of chunks needed. |
| 2 | **Vector Embeddings** | Keyword matching in-memory | Need an embedding model (e.g., sentence-transformers, OpenAI embeddings) to generate 768-dim vectors for each chunk. Store in pgvector column. Replace `searchCorpus()` with Supabase RPC call to `match_bis_chunks()`. |
| 3 | **LLM Integration** | No LLM connected. Chatbot returns raw chunk text, not synthesized answers. | Need to integrate an LLM (e.g., OpenAI GPT, Google Gemini, or open-source model) to synthesize natural language answers from retrieved chunks. The RAG pipeline currently returns raw retrieved text, not generated responses. |
| 4 | **Supabase Connection** | Schema written, client ready, but NOT configured. No env vars set. | Need to create a Supabase project, run `schema.sql`, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`, and migrate all data operations from localStorage to Supabase. |
| 5 | **User Authentication** | No auth. All data is for `local-user`. | Need Supabase Auth (email/password or OAuth). RLS policies are already written in the schema. Need to add login/signup UI, session management, and gate product/roadmap access by user. |
| 6 | **PDF Parsing** | Uses `File.text()` which only works for `.txt` files | Need a proper PDF parser (e.g., `pdf-parse`, `pdf.js`) to extract text from actual PDF documents for the document checker. |

### Important (Should-Have)

| # | Feature | Current State | What's Needed |
|---|---|---|---|
| 7 | **Real Lab Data** | 5 hardcoded demo labs | Scrape/integrate BIS recognized laboratory database. Add search, map view, contact info. |
| 8 | **Real Licence Verification** | 3 hardcoded demo records | Integrate with BIS API or database for real-time licence verification. |
| 9 | **Real Amendment Monitoring** | 3 hardcoded simulated alerts | Build a pipeline to track BIS gazette notifications, amendments, and corrigenda. Push notifications. |
| 10 | **Document Storage** | Files are processed client-side and discarded | Upload files to Supabase Storage, store extracted text in `uploaded_documents` table, persist compliance evidence results. |
| 11 | **Compliance Evidence Persistence** | Document analysis results are not saved | Save results to `compliance_evidence` table with source references and assessment classifications. |
| 12 | **Dark Mode Toggle** | CSS variables defined for dark mode but no UI toggle | Add a dark mode toggle button. The `.dark` class CSS is already written. |
| 13 | **API Routes** | All logic is client-side | Move RAG search, roadmap generation, and document analysis to Next.js API routes for better security and performance. Keep LLM API keys server-side. |

### Nice-to-Have (Polish)

| # | Feature | Notes |
|---|---|---|
| 14 | **Loading skeletons** | CSS is defined (`.skeleton`) but not used on any pages |
| 15 | **Error boundaries** | No error handling UI |
| 16 | **More languages** | Only EN and HI. Could add Tamil, Bengali, Marathi, etc. |
| 17 | **Product edit** | Can only create and delete, not edit product details |
| 18 | **Roadmap regeneration confirmation** | Regenerating a roadmap silently deletes the old one |
| 19 | **Export/Print roadmap** | No export to PDF/print functionality |
| 20 | **Analytics dashboard** | No usage analytics or compliance statistics |
| 21 | **Onboarding flow** | No guided onboarding for first-time users |
| 22 | **Accessibility audit** | Basic aria labels are present, but no full WCAG audit |
| 23 | **Performance optimization** | No code splitting, lazy loading, or image optimization |
| 24 | **Deployment** | No CI/CD pipeline, Vercel config, or Docker setup |

---

## 14. How to Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → Opens at http://localhost:3000

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build
npm start
```

**No `.env` file needed** for the demo/prototype mode — the app falls back to mock data when Supabase credentials are not configured.

---

## 15. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16 App Router)          │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Landing  │  │Assistant │  │ Products │  │  Labs    │         │
│  │  Page    │  │ (Chat)   │  │ Workspace│  │ Verify   │         │
│  │   /      │  │/assistant│  │/products │  │ Alerts   │         │
│  └──────────┘  └────┬─────┘  └────┬─────┘  └──────────┘         │
│                     │             │                               │
│              ┌──────▼──────┐  ┌───▼────────────┐                 │
│              │  RAG Engine │  │Workspace Store │                 │
│              │ vectorStore │  │  (localStorage)│                 │
│              │  .ts        │  │  store.ts      │                 │
│              └──────┬──────┘  └───┬────────────┘                 │
│                     │             │                               │
│              ┌──────▼─────────────▼──────┐                       │
│              │     Mock Data (seedData)   │   ← CURRENT STATE    │
│              │   2 standards, 8 chunks    │                       │
│              │   5 labs, 3 licences       │                       │
│              └───────────────────────────┘                       │
│                                                                   │
│  ┌────────────────────────────────────────────────┐              │
│  │           TRUST LAYER (Architectural)           │              │
│  │  ┌──────────────────────────────────────────┐  │              │
│  │  │ <SourcedClaim />  — SINGLE reusable       │  │              │
│  │  │ component for ALL AI-generated claims.    │  │              │
│  │  │                                           │  │              │
│  │  │ Three states:                             │  │              │
│  │  │ 🟢 VERIFIED_BIS_DATA                      │  │              │
│  │  │ 🟡 AI_INTERPRETATION                      │  │              │
│  │  │ ⚪ NO_MATCHING_SOURCE                     │  │              │
│  │  └──────────────────────────────────────────┘  │              │
│  └────────────────────────────────────────────────┘              │
│                                                                   │
│  ┌─────────────┐                                                 │
│  │ i18n (EN/HI)│ — LanguageProvider Context                     │
│  └─────────────┘                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  PLANNED (NOT YET  │
                    │   CONNECTED)       │
                    │                    │
                    │  Supabase          │
                    │  ├─ PostgreSQL     │
                    │  ├─ pgvector       │
                    │  ├─ Auth           │
                    │  ├─ Storage        │
                    │  └─ RLS Policies   │
                    │                    │
                    │  LLM (GPT/Gemini)  │
                    │  Embedding Model   │
                    └────────────────────┘
```

---

## Summary for Another AI

If you're an AI reading this to understand the project:

1. **This is a Smart India Hackathon 2026 project** (Problem Statement 26107) — an AI-powered BIS compliance assistant for Indian manufacturers.
2. **It's a Next.js 16 + React 19 + TypeScript web app** with a beautiful custom design system.
3. **The CORE architectural innovation is the "Trust Layer"** — a three-state confidence classification (`VERIFIED_BIS_DATA`, `AI_INTERPRETATION`, `NO_MATCHING_SOURCE`) enforced through a single `<SourcedClaim />` component that wraps EVERY AI-generated claim in the UI. This prevents hallucination and false compliance assertions.
4. **Currently runs entirely on mock/demo data** — no LLM, no real embeddings, no database connection. It has 2 demo BIS standards with 8 clause-level chunks, keyword search instead of vector similarity, and localStorage instead of Supabase.
5. **The full Supabase database schema is written** (210 lines of SQL with pgvector, RLS policies, similarity search function) but NOT deployed or connected.
6. **The frontend is ~95% complete** — all pages, components, i18n, design system, responsive layout, and animations are built and working.
7. **The backend is ~5% complete** — no real data pipeline, no LLM integration, no auth, no real database connection.
8. **26 tests pass** covering RAG search behavior, trust layer rendering, verification safety, and workspace CRUD.
9. **To make this production-ready**, you need: real BIS data ingestion, an embedding model, LLM integration, Supabase deployment, auth, and PDF parsing.
