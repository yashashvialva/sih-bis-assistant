import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/db/supabaseClient';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB Error' }, { status: 500 });

    const resolvedParams = await params;
    const stepId = resolvedParams.stepId;
    const { status } = await req.json();

    if (!['PENDING', 'COMPLETED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('roadmap_steps')
      .update({ status })
      .eq('id', stepId)
      .select()
      .single();

    if (error) throw error;

    // Update overall roadmap completion percentage
    const { data: allSteps } = await supabase
      .from('roadmap_steps')
      .select('status')
      .eq('roadmap_id', data.roadmap_id);

    if (allSteps) {
      const totalSteps = allSteps.length;
      const completedSteps = allSteps.filter((s: any) => s.status === 'COMPLETED').length;
      const percentage = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

      await supabase
        .from('roadmaps')
        .update({ completion_percentage: percentage })
        .eq('id', data.roadmap_id);
    }

    return NextResponse.json({ step: data });
  } catch (error: any) {
    console.error('Step update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
