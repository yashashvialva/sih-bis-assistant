import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabaseClient';

export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const { data, error } = await supabase
    .from('ingestion_jobs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mappedJobs = data.map((job: any) => ({
    id: job.id,
    status: job.status,
    triggerType: job.trigger_type,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    sourcesDiscovered: job.sources_discovered,
    sourcesFetched: job.sources_fetched,
    sourcesRejected: job.sources_rejected,
    documentsCreated: job.documents_created,
    documentsUpdated: job.documents_updated,
    chunksCreated: job.chunks_created,
    embeddingsGenerated: job.embeddings_generated,
    errors: job.errors,
    log: job.log,
  }));

  return NextResponse.json({ jobs: mappedJobs });
}
