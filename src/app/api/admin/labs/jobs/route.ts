import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/db/supabaseClient';

/**
 * GET /api/admin/labs/jobs
 * Returns recent lab discovery jobs.
 */
export async function GET() {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const { data: jobs, error } = await supabase
      .from('lab_discovery_jobs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch jobs.' }, { status: 500 });
    }

    return NextResponse.json({ jobs: jobs || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
