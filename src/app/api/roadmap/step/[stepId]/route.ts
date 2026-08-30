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

    // Optional: Update overall roadmap completion percentage
    // To keep it simple, we can just return the updated step here
    // and let the frontend calculate the progress visually, 
    // or we can calculate it here. For robustness, we will let frontend derive it.

    return NextResponse.json({ step: data });
  } catch (error: any) {
    console.error('Step update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
