# SIH 2026 - BIS Smart AI Assistant

An intelligent, AI-powered compliance and discovery assistant designed for the Bureau of Indian Standards (BIS). This application streamlines the ingestion of technical standards, applies a strict provenance-based trust layer, and provides manufacturers with an interactive RAG (Retrieval-Augmented Generation) chat interface to query compliance requirements.

## Features

- **Automated Standard Discovery**: Connects to BIS catalog sources to identify technical standards.
- **Strict Provenance Trust Layer**: Implements a human-in-the-loop verification system. 
  - `OFFICIAL_SOURCE`: Discovered from a government domain.
  - `VERIFIED`: Human-reviewed for accuracy.
  - `AUTHORITATIVE`: Approved as a primary technical standard corpus.
- **Product Compliance Workspace**: Allows manufacturers to map products (e.g. Electric Kettles) to authoritative BIS standards and dynamically generates testing/compliance roadmaps.
- **Human-in-the-Loop OCR Verification**: 
  - **Live In-App Camera**: Capture BIS marks directly from the browser using `navigator.mediaDevices` with smart fallback for mobile native cameras.
  - **Local OCR Extraction**: Extract CM/L or R-numbers using local `tesseract.js` OCR.
  - **AI Verification**: Securely verify extracted numbers by parsing official government portal results with AI.
- **RAG-Powered Chat Assistant**: Uses local embeddings (`bge-base-en-v1.5`) and Groq LLMs (`qwen/qwen3.8-27b`) to answer compliance questions strictly using authorized standard chunks.
- **Multilingual Support**: Real-time localized interface supporting English, Hindi (हिंदी), Marathi (मराठी), Telugu (తెలుగు), Tamil (தமிழ்), Kannada (ಕನ್ನಡ), and Malayalam (മലയാളം).
- **Admin Ingestion Pipeline**: A dedicated dashboard for administrators to monitor, parse, and ingest PDF standards into vector chunks.
- **Vector Database**: Fully integrated with Supabase `pgvector` for semantic similarity search.

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

## License

This project is built for the SIH 2026 hackathon.
