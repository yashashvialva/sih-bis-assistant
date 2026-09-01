import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/db/supabaseClient';
import { getLLMClient, AI_CONFIG } from '@/lib/ai/config';

export async function POST(req: Request) {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB Error' }, { status: 500 });

    const body = await req.json();
    const { standardNumber, title, oldText, newText, categories } = body;

    if (!oldText || !newText || !standardNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const groq = getLLMClient();
    
    // Prompt to generate the diff
    const prompt = `
You are a BIS (Bureau of Indian Standards) compliance expert.
I will provide you with the OLD text and the NEW text of a standard.
Your job is to analyze the difference and generate a structured JSON alert for manufacturers.

OLD TEXT:
${oldText}

NEW TEXT:
${newText}

Generate a JSON object with exactly these fields:
{
  "impactSummary": "A 1-2 sentence summary of what changed",
  "affectedClause": "The specific clause or section that changed (if identifiable, else 'General')",
  "severity": "Must be one of: REVIEW_RECOMMENDED, POTENTIAL_IMPACT, INFORMATION_ONLY",
  "whatChanged": ["Array of string bullet points explaining the technical changes"],
  "recommendedActions": ["Array of string action items for the manufacturer to comply with the new standard"]
}

Output ONLY valid JSON.
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: AI_CONFIG.llmModel,
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) throw new Error('Failed to generate diff from LLM');

    const parsed = JSON.parse(result);

    // Insert into DB
    const { data: amendment, error: insertError } = await supabase
      .from('amendments')
      .insert({
        standard_number: standardNumber,
        title: title || `Update to ${standardNumber}`,
        impact_summary: parsed.impactSummary,
        affected_clause: parsed.affectedClause,
        severity: parsed.severity,
        what_changed: parsed.whatChanged,
        recommended_actions: parsed.recommendedActions,
        affected_product_categories: categories || [],
        published_date: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, amendment });
  } catch (err: any) {
    console.error('LLM Diff Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
