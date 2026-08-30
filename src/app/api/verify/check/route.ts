import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/db/supabaseClient';
import { getLLMClient, AI_CONFIG } from '@/lib/ai/config';
import { verifyWithOfficialBIS, OfficialBISResult } from '@/lib/bis/verifier';

export async function POST(request: Request) {
  try {
    const { licenceNumber, inputType, extractedText, extractionConfidence, pastedResult } = await request.json();

    if (!licenceNumber) {
      return NextResponse.json({ error: 'Licence number is required' }, { status: 400 });
    }
    
    // We get the official URL for logging/reference
    const baseOfficialResult = await verifyWithOfficialBIS(licenceNumber);

    if (!pastedResult || pastedResult.trim() === '') {
      return NextResponse.json({ error: 'Please paste the official result text.' }, { status: 400 });
    }

    let parsedResult: OfficialBISResult = {
      status: 'ERROR',
      licenceNumber: licenceNumber,
      checkedAt: new Date().toISOString(),
      officialSourceUrl: baseOfficialResult.officialSourceUrl
    };

    let aiExplanation: string | null = null;

    try {
      const client = getLLMClient();
      
      // Step 1: Strict Parsing of the pasted raw text
      const parsingPrompt = `
You are a strict data extraction engine parsing text pasted from the official Bureau of Indian Standards (BIS) portal for licence ${licenceNumber}.
Extract the following information from the RAW PASTED TEXT below and output ONLY a valid JSON object.
Do NOT invent information. If a field is not present in the pasted text, set it to null.
Status MUST be one of: "VALID", "INVALID", "EXPIRED", "NOT_FOUND", "UNAVAILABLE", or "ERROR". (If the text implies it's operative/active, use "VALID").

RAW PASTED TEXT:
"""
${pastedResult}
"""

JSON SCHEMA:
{
  "status": "VALID",
  "productName": "Example Product",
  "manufacturer": "Example Mfg",
  "standardNumber": "IS 1234",
  "validityDate": "31-Dec-2027"
}
`;

      const parsingResponse = await client.chat.completions.create({
        model: AI_CONFIG.llmModel,
        messages: [{ role: 'system', content: parsingPrompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const parsedData = JSON.parse(parsingResponse.choices[0]?.message?.content || '{}');
      
      parsedResult = {
        ...parsedResult,
        status: parsedData.status || 'ERROR',
        productName: parsedData.productName || null,
        manufacturer: parsedData.manufacturer || null,
        standardNumber: parsedData.standardNumber || null,
        validityDate: parsedData.validityDate || null,
        officialEvidence: pastedResult // Keep the raw text as evidence
      };

      // Step 2: AI Explanation
      const explanationPrompt = `
You are a BIS Compliance Assistant.
Your task is to concisely explain the following OFFICIAL BIS verification result to the user in 2-3 sentences.
You MUST NOT invent any facts, validity dates, standards, or tests that are not present in this official result.
You MUST state that this is based on the official BIS data provided.

OFFICIAL RESULT:
Status: ${parsedResult.status}
Licence Number: ${parsedResult.licenceNumber}
Product: ${parsedResult.productName || 'N/A'}
Manufacturer: ${parsedResult.manufacturer || 'N/A'}
Standard: ${parsedResult.standardNumber || 'N/A'}
Validity Date: ${parsedResult.validityDate || 'N/A'}
`;

      const explanationResponse = await client.chat.completions.create({
        model: AI_CONFIG.llmModel,
        messages: [{ role: 'system', content: explanationPrompt }],
        temperature: 0.2,
        max_tokens: 150
      });

      aiExplanation = explanationResponse.choices[0]?.message?.content || null;

    } catch (llmError) {
      console.warn('AI Parsing/Explanation failed:', llmError);
      return NextResponse.json({ error: 'Failed to analyze the pasted result.' }, { status: 500 });
    }

    // 3. Log the Verification Event
    const supabase = getAdminSupabase();
    if (supabase) {
      await supabase.from('bis_verification_events').insert({
        input_type: inputType || 'MANUAL',
        licence_number: licenceNumber,
        extracted_text: extractedText,
        extraction_confidence: extractionConfidence,
        verification_status: 'OFFICIAL_RESULT_PROVIDED', // Logging exact requested status
        product_name: parsedResult.productName,
        manufacturer: parsedResult.manufacturer,
        standard_number: parsedResult.standardNumber,
        validity_date: parsedResult.validityDate,
        official_source_url: parsedResult.officialSourceUrl,
        official_response: parsedResult.officialEvidence, // The raw text
        ai_explanation: aiExplanation
      });
    }

    return NextResponse.json({ 
      result: parsedResult,
      explanation: aiExplanation 
    });
  } catch (error: any) {
    console.error('API /verify/check POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
