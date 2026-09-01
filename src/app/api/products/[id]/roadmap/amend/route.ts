import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/db/supabaseClient';
import type { SimulatedAmendment } from '@/lib/types';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB Error' }, { status: 500 });

    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    // Expect an array of amendments in the request body
    const body = await req.json();
    const amendments: SimulatedAmendment[] = body.amendments;

    if (!amendments || !amendments.length) {
      return NextResponse.json({ error: 'No amendments provided' }, { status: 400 });
    }

    // 1. Get the existing roadmap
    const { data: roadmap, error: rmError } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (rmError || !roadmap) {
      return NextResponse.json({ error: 'Roadmap not found. Generate one first.' }, { status: 404 });
    }

    // 2. Get current highest order_index
    const { data: existingSteps, error: stepsError } = await supabase
      .from('roadmap_steps')
      .select('order_index')
      .eq('roadmap_id', roadmap.id)
      .order('order_index', { ascending: false })
      .limit(1);

    let nextOrderIndex = existingSteps && existingSteps.length > 0 
      ? existingSteps[0].order_index + 1 
      : 0;

    // 3. Prepare new steps from amendment recommended actions
    const newSteps = [];
    
    for (const amendment of amendments) {
      if (amendment.recommendedActions && amendment.recommendedActions.length > 0) {
        for (const action of amendment.recommendedActions) {
          newSteps.push({
            roadmap_id: roadmap.id,
            title: `Amendment Action: ${amendment.standardNumber}`,
            description: action,
            status: 'PENDING',
            step_type: 'COMPLIANCE_UPDATE', // Custom type for amendments
            source_clause: amendment.affectedClause || 'Recent Amendment',
            confidence_level: 'VERIFIED_BIS_DATA',
            order_index: nextOrderIndex++,
          });
        }
      } else {
        // Fallback if no recommended actions
        newSteps.push({
          roadmap_id: roadmap.id,
          title: `Comply with ${amendment.standardNumber} Amendment`,
          description: amendment.impactSummary || 'Review the recent amendment for compliance.',
          status: 'PENDING',
          step_type: 'COMPLIANCE_UPDATE',
          source_clause: amendment.affectedClause || 'Recent Amendment',
          confidence_level: 'VERIFIED_BIS_DATA',
          order_index: nextOrderIndex++,
        });
      }
    }

    // 4. Insert new steps
    const { error: insertError } = await supabase
      .from('roadmap_steps')
      .insert(newSteps);

    if (insertError) {
      throw new Error(`Failed to insert amendment steps: ${insertError.message}`);
    }

    return NextResponse.json({ success: true, addedSteps: newSteps.length });
  } catch (err: any) {
    console.error('Amendment Roadmap Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
