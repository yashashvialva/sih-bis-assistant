import { NextResponse } from 'next/server';
import { AI_CONFIG, getLLMClient } from '@/lib/ai/config';

export async function POST(req: Request) {
  try {
    const { amendment, productName, productCategory } = await req.json();

    if (!amendment || !productName) {
      return NextResponse.json(
        { error: 'Amendment and product name are required' },
        { status: 400 }
      );
    }

    // If Groq API key is not configured, return template-based analysis
    if (!AI_CONFIG.groqApiKey) {
      return NextResponse.json({
        impactSummary: `This amendment to ${amendment.standardNumber} may affect your product "${productName}" in the ${productCategory} category. Review the specific changes listed below to determine if re-testing or documentation updates are required.`,
        actionItems: amendment.recommendedActions || [
          'Review the amendment notice for clauses applicable to your product',
          'Contact your testing laboratory to discuss any re-testing requirements',
          'Update your compliance roadmap to reflect new requirements',
        ],
        riskLevel: amendment.severity === 'REVIEW_RECOMMENDED' ? 'HIGH' : 'MEDIUM',
      });
    }

    const systemPrompt = `You are the BIS Compliance Assistant, helping manufacturers understand how a BIS standard amendment affects their specific product.

You must:
- Be specific about the impact on the given product
- Provide actionable recommendations
- Never claim to determine compliance status
- Be clear this is AI-assisted guidance, not official BIS advice

Respond in JSON format:
{
  "impactSummary": "A 2-3 sentence personalized summary of how this amendment specifically impacts the manufacturer's product",
  "actionItems": ["Specific action 1", "Specific action 2", "..."],
  "riskLevel": "HIGH" | "MEDIUM" | "LOW"
}

Risk level guidelines:
- HIGH: Amendment requires re-testing, design changes, or immediate action
- MEDIUM: Amendment requires documentation updates or minor adjustments
- LOW: Amendment is informational with no immediate action required`;

    const userPrompt = `A BIS standard has been amended. Analyze the impact on this specific product:

PRODUCT: ${productName}
CATEGORY: ${productCategory}

AMENDMENT DETAILS:
- Standard: ${amendment.standardNumber}
- Title: ${amendment.title}
- Affected Clause: ${amendment.affectedClause || 'Not specified'}
- Severity: ${amendment.severity}
- Impact Summary: ${amendment.impactSummary}
- What Changed: ${(amendment.whatChanged || []).join('; ')}
- Published: ${amendment.publishedDate}

Provide a personalized impact analysis for this manufacturer.`;

    const chatCompletion = await getLLMClient().chat.completions.create({
      model: AI_CONFIG.llmModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseText);

    return NextResponse.json({
      impactSummary: parsed.impactSummary || amendment.impactSummary,
      actionItems: parsed.actionItems || amendment.recommendedActions || [],
      riskLevel: parsed.riskLevel || 'MEDIUM',
    });
  } catch (error) {
    console.error('Alert Analysis API Error:', error);
    // Fallback to template-based response on error
    return NextResponse.json({
      impactSummary: 'Unable to generate AI analysis at this time. Please review the amendment details manually.',
      actionItems: [
        'Review the amendment notice on the BIS portal',
        'Consult with your testing laboratory',
        'Update your compliance documentation as needed',
      ],
      riskLevel: 'MEDIUM',
    });
  }
}
