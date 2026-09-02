import { NextResponse } from 'next/server';
import { AI_CONFIG, getLLMClient } from '@/lib/ai/config';
import { getAdminSupabase } from '@/lib/db/supabaseClient';
import { searchCorpusVector } from '@/lib/rag/vectorStore';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB Error' }, { status: 500 });
    
    // Await params object for Next.js 15
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    const { data: roadmap, error: rmError } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (rmError || !roadmap) {
      return NextResponse.json({ roadmap: null });
    }

    const { data: steps, error: stepsError } = await supabase
      .from('roadmap_steps')
      .select('*')
      .eq('roadmap_id', roadmap.id)
      .order('order_index', { ascending: true });

    const mappedSteps = (steps || []).map(s => ({
      id: s.id,
      roadmapId: s.roadmap_id,
      orderIndex: s.order_index,
      stepType: s.step_type,
      title: s.title,
      description: s.description,
      sourceChunkId: s.source_chunk_id,
      sourceClause: s.source_clause,
      confidenceLevel: s.confidence_level,
      status: s.status,
      createdAt: s.created_at
    }));

    return NextResponse.json({ roadmap, steps: mappedSteps });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB Error' }, { status: 500 });

    const resolvedParams = await params;
    const productId = resolvedParams.id;

    // Get the product details
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (prodError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check existing roadmap
    const { data: existingRm } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (existingRm) {
      return NextResponse.json({ error: 'Roadmap already exists' }, { status: 400 });
    }

    const productName = product.name;
    const productCategory = product.category;
    const productDescription = product.description || '';

    // Step 1: Find mappings
    const { data: mappings, error: mappingError } = await supabase
      .from('product_standard_mappings')
      .select(`*, source_documents(verification_status, authoritative)`)
      .eq('product_category', productCategory);

    const authoritativeMappings = (mappings || []).filter(m => 
      m.source_documents && 
      m.source_documents.verification_status === 'AUTHORITATIVE' && 
      m.source_documents.authoritative === true
    );

    if (authoritativeMappings.length === 0) {
      return NextResponse.json({ error: 'No authoritative standard available.' }, { status: 404 });
    }

    const mappedStandards = authoritativeMappings.map(m => m.standard_number.replace(/\s+/g, '').toLowerCase());
    const primaryStandardNumber = authoritativeMappings[0]?.standard_number || null;
    
    let actualStandardId = null;
    if (primaryStandardNumber) {
      const { data: standardData } = await supabase
        .from('bis_standards')
        .select('id')
        .eq('standard_number', primaryStandardNumber)
        .single();
      
      actualStandardId = standardData?.id || null;
    }

    // Step 2: Retrieve Chunks
    const query = `What are the detailed BIS certification requirements, scope, testing, marking and documentation required for ${productName} (${productCategory})? Description: ${productDescription}`;
    const searchResults = await searchCorpusVector(query, 15);
    const relevantChunks = searchResults.map(r => r.chunk).filter(c => mappedStandards.includes((c.standardNumber || '').replace(/\s+/g, '').toLowerCase()));

    if (relevantChunks.length === 0) {
      return NextResponse.json({ error: 'No evidence chunks retrieved.' }, { status: 404 });
    }

    const contextText = relevantChunks
      .map(c => `SOURCE CHUNK [ID: ${c.id}]\nStandard: ${c.standardNumber} (Clause: ${c.clause || 'N/A'})\nContent:\n${c.content}\nEND SOURCE`)
      .join('\n\n');

    // Step 3: LLM Generation
    const systemPrompt = `You are an expert BIS Compliance Extraction Engine.
Extract factual compliance requirements from the supplied BIS evidence.
CRITICAL RULES:
1. Use ONLY the supplied evidence. NEVER use outside knowledge.
2. NEVER invent clauses, tests, documents, or steps.
3. Every requirement MUST contain its supporting source_chunk_id.
4. If a category is missing, return an empty array.

JSON SCHEMA:
{
  "scope": [{ "requirement": "...", "clause": "...", "source_chunk_id": "..." }],
  "testing": [{ "requirement": "...", "clause": "...", "source_chunk_id": "..." }],
  "marking": [{ "requirement": "...", "clause": "...", "source_chunk_id": "..." }],
  "documentation": [{ "requirement": "...", "clause": "...", "source_chunk_id": "..." }]
}
Source Context:
${contextText}`;

    const chatCompletion = await getLLMClient().chat.completions.create({
      model: AI_CONFIG.llmModel,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: query }],
      response_format: { type: 'json_object' },
      temperature: 0.0,
    });

    const parsedResponse = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');

    // Step 4: INSERT into DB
    const { data: newRoadmap, error: rmInsertError } = await supabase
      .from('roadmaps')
      .insert({
        product_id: productId,
        standard_id: actualStandardId,
        status: 'IN_PROGRESS',
        completion_percentage: 0
      })
      .select()
      .single();

    if (rmInsertError) throw rmInsertError;

    const stepsToInsert: any[] = [];
    let orderIndex = 1;

    const addSteps = (items: any[], type: string) => {
      if (!Array.isArray(items)) return;
      for (const item of items) {
        stepsToInsert.push({
          roadmap_id: newRoadmap.id,
          order_index: orderIndex++,
          step_type: type,
          title: item.requirement.substring(0, 50) + (item.requirement.length > 50 ? '...' : ''),
          description: item.requirement,
          source_chunk_id: item.source_chunk_id || null,
          source_clause: item.clause || null,
          confidence_level: 'VERIFIED_BIS_DATA',
          status: 'PENDING'
        });
      }
    };

    addSteps(parsedResponse.scope, 'STANDARD_IDENTIFICATION');
    addSteps(parsedResponse.testing, 'TESTING');
    addSteps(parsedResponse.marking, 'CERTIFICATION_REQUIREMENT');
    addSteps(parsedResponse.documentation, 'DOCUMENTATION');

    if (stepsToInsert.length > 0) {
      await supabase.from('roadmap_steps').insert(stepsToInsert);
    }

    // Fetch the newly inserted steps to return
    const { data: finalSteps } = await supabase
      .from('roadmap_steps')
      .select('*')
      .eq('roadmap_id', newRoadmap.id)
      .order('order_index', { ascending: true });

    const mappedSteps = (finalSteps || []).map(s => ({
      id: s.id,
      roadmapId: s.roadmap_id,
      orderIndex: s.order_index,
      stepType: s.step_type,
      title: s.title,
      description: s.description,
      sourceChunkId: s.source_chunk_id,
      sourceClause: s.source_clause,
      confidenceLevel: s.confidence_level,
      status: s.status,
      createdAt: s.created_at
    }));

    return NextResponse.json({ roadmap: newRoadmap, steps: mappedSteps });
  } catch (error: any) {
    console.error('Roadmap API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate roadmap' }, { status: 500 });
  }
}
