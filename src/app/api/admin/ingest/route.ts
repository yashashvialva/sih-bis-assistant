import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabaseClient';
import { runIngestionPipeline } from '@/lib/ingestion/pipeline';
import type { IngestionInput } from '@/lib/ingestion/types';

export async function POST(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
  }

  try {
    const body: IngestionInput = await req.json();
    
    // Start background ingestion
    const jobId = await runIngestionPipeline(body, 'ADMIN');

    return NextResponse.json({ 
      success: true, 
      message: 'Ingestion pipeline started',
      jobId 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
