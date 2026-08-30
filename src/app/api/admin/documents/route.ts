import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabaseClient';

export const dynamic = 'force-dynamic';

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

  const mappedDocuments = data.map((doc: any) => ({
    id: doc.id,
    sourceId: doc.source_id,
    sourceUrl: doc.source_url,
    sourceDomain: doc.source_domain,
    title: doc.title,
    standardNumber: doc.standard_number,
    documentType: doc.document_type,
    verificationStatus: doc.verification_status,
    authoritative: doc.authoritative,
    discoveredBy: doc.discovered_by,
    lastCheckedAt: doc.last_checked_at,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    sourceType: doc.trusted_sources?.source_type || 'UNKNOWN',
  }));

  return NextResponse.json({ documents: mappedDocuments });
}
