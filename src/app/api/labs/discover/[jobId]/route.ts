import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/db/supabaseClient';

/**
 * GET /api/labs/discover/[jobId]
 * 
 * Returns the status of a lab discovery job for progress polling.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const { data: job, error } = await supabase
      .from('lab_discovery_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    // If job is completed, also fetch the updated labs
    let labs: any[] = [];
    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      const { data: labData } = await supabase
        .from('laboratories')
        .select('*')
        .eq('state', job.state)
        .eq('source_type', 'BIS_LIMS')
        .order('name', { ascending: true });
      
      labs = labData || [];
    }

    return NextResponse.json({ job, labs });
  } catch (error: any) {
    console.error('API /labs/discover/[jobId] error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
