import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabaseClient';

export async function GET(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('source_documents')
    .select(`
      *,
      trusted_sources (name, source_type)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('verification_status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data });
}
