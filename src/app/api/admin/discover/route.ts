import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabaseClient';
import { runDiscoveryPipeline } from '@/lib/ingestion/pipeline';
import type { IngestionInput } from '@/lib/ingestion/types';

export async function POST(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
  }

  try {
    const body: IngestionInput = await req.json();
    
    // Start background discovery (Phase 1)
    const jobId = await runDiscoveryPipeline(body, 'ADMIN');

    return NextResponse.json({ 
      success: true, 
      message: 'Discovery pipeline started',
      jobId 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
