import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabaseClient';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('trusted_sources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sources: data });
}

export async function POST(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
  }

  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.base_url || !body.domain || !body.source_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('trusted_sources')
      .insert({
        name: body.name,
        base_url: body.base_url,
        domain: body.domain,
        source_type: body.source_type,
        enabled: body.enabled ?? true,
        verification_policy: body.verification_policy || 'REQUIRES_REVIEW',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ source: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
