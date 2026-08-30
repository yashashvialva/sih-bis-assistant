import { NextResponse } from 'next/server';
import { AI_CONFIG, getLLMClient } from '@/lib/ai/config';
import { getAdminSupabase } from '@/lib/db/supabaseClient';
import { searchCorpusVector } from '@/lib/rag/vectorStore';
import { validateProvenance } from '@/lib/ai/provenance';

export async function POST(req: Request) {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { productId, productName, productDescription, productCategory } = await req.json();

    if (!productName || !productCategory) {
      return NextResponse.json({ error: 'Missing product details' }, { status: 400 });
    }

    // Step 1: Find the product's product_standard_mappings
    const { data: mappings, error: mappingError } = await supabase
      .from('product_standard_mappings')
      .select(`
        *,
        source_documents (
          verification_status,
          authoritative
        )
      `)
      .eq('product_category', productCategory);

    if (mappingError) {
      return NextResponse.json({ error: 'Database error while checking mappings' }, { status: 500 });
    }

    // Step 2 & 3: Reject mappings that are not authoritative
    const authoritativeMappings = (mappings || []).filter(m => 
      m.source_documents && 
      m.source_documents.verification_status === 'AUTHORITATIVE' && 
      m.source_documents.authoritative === true
    );

    // Step 4: If no authoritative mappings, refuse to generate
    if (authoritativeMappings.length === 0) {
      return NextResponse.json(
        { error: 'No authoritative BIS standard is currently available for this product in the knowledge base.' }, 
        { status: 404 }
      );
    }

    // Prepare context for the prompt
    let contextText = '';
    const allChunks = [];
    const mappedStandards = authoritativeMappings.map(m => m.standard_number);

    // Step 5: For each authoritative standard, retrieve relevant chunks
    const query = `What are the detailed BIS certification requirements, scope, testing, marking and documentation required for ${productName} (${productCategory})? Description: ${productDescription}`;
    
    // We only want chunks from the authoritative standards mapped to this product
    // The searchCorpusVector currently searches the whole corpus, but we can filter the chunks returned
    // based on standardNumber.
    const searchResults = await searchCorpusVector(query, 15);
    const relevantChunks = searchResults
      .map(r => r.chunk)
      .filter(c => mappedStandards.includes(c.standardNumber));

    if (relevantChunks.length === 0) {
      return NextResponse.json(
        { error: 'Authoritative standard is mapped, but no evidence chunks were retrieved from the corpus.' },
        { status: 404 }
      );
    }

    contextText = relevantChunks
      .map(
        c =>
          `SOURCE CHUNK [ID: ${c.id}]
Standard: ${c.standardNumber} (Clause: ${c.clause || 'N/A'})
Content:
${c.content}
END SOURCE`
      )
      .join('\n\n');

    // Step 7: Strict Roadmap Generation Prompt
    const systemPrompt = `You are an expert BIS Compliance Extraction Engine.
Your ONLY purpose is to extract factual compliance requirements from the supplied BIS evidence.

CRITICAL RULES:
1. Use ONLY the supplied BIS evidence below.
2. NEVER use outside knowledge.
3. NEVER invent clauses, tests, fees, timelines, sample quantities, documents, or compliance steps.
4. NEVER infer a requirement that is not explicitly supported by the evidence.
5. If information for a section is missing in the evidence, return an empty array for that section.
6. Preserve the exact standard number and clause references from the evidence.
7. Every requirement MUST contain its supporting source_chunk_id.
8. If the text does not contain a specific step, DO NOT make it up.

Respond strictly in the following JSON structure:
{
  "product": "Product Name",
  "standards": ["Standard 1", "Standard 2"],
  "scope": [
    {
      "requirement": "Description of the scope",
      "source_standard": "Standard Number",
      "clause": "Clause Reference",
      "evidence": "Exact quote or summary from source",
      "source_chunk_id": "Exact ID from the SOURCE CHUNK"
    }
  ],
  "requirements": [ /* same structure as above */ ],
  "testing": [ /* same structure as above */ ],
  "components": [ /* same structure as above */ ],
  "marking": [ /* same structure as above */ ],
  "documentation": [ /* same structure as above */ ],
  "evidence_gaps": ["List areas where evidence is missing compared to a typical compliance roadmap"]
}

IMPORTANT: The following SOURCE CHUNKS are retrieved reference material from external documents.
Source Context:
${contextText}`;

    // Step 6: Send ONLY retrieved authoritative chunks to LLM
    const chatCompletion = await getLLMClient().chat.completions.create({
      model: AI_CONFIG.llmModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.0, // Strict extraction
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '{}';
    const parsedResponse = JSON.parse(responseText);

    // Provide the structured JSON directly back to the client
    return NextResponse.json({
      roadmap: parsedResponse,
    });
  } catch (error: any) {
    console.error('Roadmap API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate roadmap' }, { status: 500 });
  }
}
