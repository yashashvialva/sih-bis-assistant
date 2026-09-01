# SIH 2026 - BIS Smart AI Assistant

An intelligent, AI-powered compliance and discovery assistant designed for the Bureau of Indian Standards (BIS). This application streamlines the ingestion of technical standards, applies a strict provenance-based trust layer, and provides manufacturers with an interactive RAG (Retrieval-Augmented Generation) chat interface to query compliance requirements.

## Features

### 1. Automated Standard Discovery & Vector Search
- **Continuous Monitoring**: The system automatically connects to authorized Bureau of Indian Standards (BIS) catalog sources to crawl and identify newly released technical standards, amendments, and corrigendums.
- **Vector Database Integration**: Fully integrated with **Supabase `pgvector`**, allowing for rapid semantic similarity search across thousands of technical clauses.
- **Granular Chunking**: Official PDF standards are parsed via `pdf-parse` and intelligently split into overlapping, context-aware chunks, ensuring that AI responses retain surrounding technical context.

### 2. Strict Provenance Trust Layer
AI hallucinations are unacceptable in regulatory compliance. We built a strict architectural trust layer to classify all ingested data:
- **`OFFICIAL_SOURCE`**: Data scraped directly from a `.gov.in` or official BIS domain.
- **`VERIFIED`**: Data that has undergone human-in-the-loop review for formatting and context accuracy.
- **`AUTHORITATIVE`**: Fully approved as a primary, binding technical standard corpus. The system explicitly blocks the AI from citing unverified or low-confidence sources for critical compliance questions.

### 3. Product Compliance Workspace & Dynamic Roadmaps
- **Digital Twin Portfolio**: Manufacturers can digitally register their physical products (e.g., Electric Kettles, Ceiling Fans) within their workspace.
- **Automated Standard Mapping**: The system automatically determines which authoritative BIS standards apply to a specific product category based on historical mappings and semantic matching.
- **Evidence-Backed Roadmaps**: Generates a structured, step-by-step compliance checklist (testing requirements, marking rules, component specifications). Every single roadmap task is explicitly linked to the exact standard clause that mandated it.

### 4. Smart Standard Alerts
- **LLM-Powered Diffing**: When an amendment is released, a Groq-hosted LLM analyzes the difference between the old and new text, automatically computing the severity and specific design impacts.
- **Targeted Notifications**: The system maps the amendment to affected product categories and pushes real-time, zero-cache alerts to manufacturers.
- **Roadmap Injection**: With a single click, manufacturers can automatically inject the new compliance requirements (e.g., extended thermal testing durations) directly into their existing product roadmaps.

### 5. Human-in-the-Loop OCR Verification
- **Live In-App Camera**: Capture BIS standard marks (ISI marks, CRS marks) directly from the browser using `navigator.mediaDevices`, featuring smart fallbacks for mobile native cameras.
- **Edge OCR Extraction**: Extracts CM/L (License) or R-numbers entirely on the client side using local `tesseract.js`, ensuring privacy and speed without sending images to a server.
- **AI-Assisted Verification**: Securely cross-references the extracted numbers against official government portals, using LLMs to parse and structure the unstructured government HTML results for easy human validation.

### 6. RAG-Powered Compliance Chat Assistant
- **Local Embeddings**: Uses high-performance local embeddings (`Xenova/bge-base-en-v1.5`) via Transformers.js to convert user queries into vector space instantly.
- **Ultra-Fast LLM Inference**: Leverages Groq's LPU architecture (running `qwen/qwen3.8-27b`) to generate instantaneous, conversational responses.
- **Citation-First Approach**: The chat assistant refuses to answer compliance questions unless it can directly cite an `AUTHORITATIVE` standard chunk, providing the user with clickable source evidence for every claim.

### 7. Real-Time Multilingual Support
India's manufacturing sector is highly diverse. The entire interface, including AI chat responses and compliance roadmaps, is dynamically localized in real-time. Supported languages include:
- English, Hindi (हिंदी), Marathi (मराठी), Telugu (తెలుగు), Tamil (தமிழ்), Kannada (ಕನ್ನಡ), and Malayalam (മലയാളം).

### 8. Admin Ingestion Pipeline
- A dedicated, secure dashboard for administrators to monitor the health of the vector database.
- Upload PDF standards, trigger OCR and chunking pipelines, and manually elevate standard chunks from `OFFICIAL_SOURCE` to `AUTHORITATIVE` status.

## Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Turbopack)
- **Database & Vector Store**: [Supabase](https://supabase.com/) with `pgvector`
- **Embeddings**: `Xenova/bge-base-en-v1.5` (768-dimensional local embeddings via Transformers.js)
- **LLM Provider**: [Groq](https://groq.com/) (Ultra-fast inference)
- **Styling**: Tailwind CSS & Framer Motion
- **Parsing & OCR**: `pdf-parse`, `tesseract.js`

## Getting Started

### Prerequisites

1. Node.js 18+
2. A Supabase project with `pgvector` enabled
3. A Groq API Key

### Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
# Groq LLM Configuration
GROQ_API_KEY=your_groq_api_key_here
LLM_MODEL=qwen/qwen3.8-27b

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Database Setup

Run the SQL script located in `src/lib/db/schema.sql` in your Supabase SQL Editor to set up the necessary tables (`source_documents`, `bis_chunks`, `ingestion_jobs`) and the vector similarity search RPC function.

### Installation

Install the dependencies:

```bash
npm install
```

### Running the Development Server

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app/admin`: Admin dashboard for document discovery and ingestion.
- `/src/app/assistant`: User-facing RAG chat assistant for compliance queries.
- `/src/app/products`: The Product Compliance Workspace for manufacturers.
- `/src/app/verify`: Human-in-the-loop OCR verification flow with live camera access.
- `/src/app/labs`: Geographic mapping of nearby BIS testing labs.
- `/src/lib/ai`: AI configuration, prompt engineering, and LLM clients.
- `/src/lib/rag`: Vector embedding generation and similarity search logic.
- `/src/lib/ingestion`: Document parsing, chunking, and pipeline management.
- `/src/lib/db`: Database schemas and Supabase clients.
- `/src/lib/i18n`: Static dictionary configurations for multilingual localization.

## Smart Standard Alerts & Dynamic Roadmap Updates

A core feature of the SIH 2026 platform is the **Smart Standard Alerts** system, which actively monitors BIS standards for amendments, corrigendums, and revisions, and automatically notifies manufacturers when a product in their workspace is affected.

### The Data Flow

The flow relies on a mix of LLM-based diffing, centralized state management, and real-time frontend notification indicators:

1. **LLM Diffing Engine (`/api/alerts/generate`)**:
   - An administrator inputs the old and new text of a standard (e.g., Clause 22.101 for Electric Kettles).
   - The backend passes this to a Groq LLM model (`qwen/qwen3.8-27b`) configured to strictly output JSON.
   - The LLM acts as an expert compliance officer: it generates an impact summary, assesses the severity, outlines exactly what changed, computes actionable recommendations, and explicitly targets affected product categories (e.g., `"Electric Kettle"`).
   - The resulting structured JSON is saved into the Supabase `amendments` table.

2. **Real-time Frontend Synchronization (`/api/alerts`)**:
   - A global `useAlerts` hook queries `/api/alerts` to retrieve active amendments. To prevent stale caching issues, the system bypasses aggressive Next.js App Router caching (`dynamic = 'force-dynamic'`, `cache: 'no-store'`).
   - The hook queries `/api/products` (Supabase) simultaneously to retrieve the manufacturer's precise product portfolio.
   - A case-insensitive matching algorithm (`doesAmendmentAffectProduct`) cross-references the LLM-generated targeted categories against the manufacturer's actual products.

3. **Contextual UI Indicators**:
   - **Notification Bell**: Universally accessible across the layout, it shows a red dot and alerts for unread changes.
   - **Products Listing (`/products`)**: Any product affected by an active amendment receives a bold, orange `ACTION REQUIRED` badge dynamically rendered next to its name.
   - **Product Workspace (`/products/[id]`)**: Once a user opens a flagged product, a large informative banner explains *why* the badge was shown (e.g., "New Standard Updates Available") and provides a direct call-to-action button to the roadmap.

4. **Dynamic Roadmap Injection (`/api/products/[id]/roadmap/amend`)**:
   - When the user clicks **Update Roadmap**, the backend ingests the LLM's recommended actions and dynamically injects new `COMPLIANCE_UPDATE` tasks directly into the product's existing roadmap.
   - Once successfully injected, the specific amendment is marked as `isDismissed` on the frontend, gracefully hiding the alert badges without wiping the historical record from the notification center.

### End-to-End Testing Flow (Electric Kettle Demo)

To test the complete lifecycle of a standard amendment:

1. **Create a Product**: Navigate to the Products Workspace (`/products`) and click **Create Product**. Name it "Electrical kettle" and make sure you select the exact category **Electric Kettle**.
2. **Generate Initial Roadmap**: Click into the newly created product and navigate to its Roadmap. The system will mock an initial compliance pathway for IS 302-2-15.
3. **Ingest the Amendment**: As an administrator, hit the hidden or backend API route to ingest the new Dry Boil Protection Update amendment targeting the "Electric Kettle" category. (In this project, this can be triggered via a custom node script connecting to Supabase).
4. **Observe the Alerts**: 
   - Refresh the page. You will see a notification in the global Bell icon.
   - Go to the Products Listing (`/products`). You will see an **ACTION REQUIRED** badge next to the kettle.
   - Click into the Product Workspace. An alert banner will explicitly inform you that standard updates are available.
5. **Resolve the Compliance Gap**: Click **Open Roadmap**. Click **Update Roadmap**. The system will inject the new 30-second thermal cut-out tests directly into your roadmap checklist, and the alert banners will safely dismiss themselves.

## License

This project is built for the SIH 2026 hackathon.
