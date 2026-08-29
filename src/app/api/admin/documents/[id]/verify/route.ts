import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabaseClient';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
  }

  try {
    const { action } = await req.json(); // 'VERIFY' | 'REJECT'
    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    let newStatus = '';
    let newAuthoritative = false;

    if (action === 'VERIFY') {
      newStatus = 'AUTHORITATIVE';
      newAuthoritative = true;
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
      newAuthoritative = false;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // 1. Update document
    const { error: docError } = await supabase
      .from('source_documents')
      .update({
        verification_status: newStatus,
        authoritative: newAuthoritative,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (docError) throw docError;

    // 2. Cascade status to all child chunks
    const { error: chunkError } = await supabase
      .from('bis_chunks')
      .update({
        verification_status: newStatus,
        authoritative: newAuthoritative
      })
      .eq('source_document_id', documentId);

    if (chunkError) throw chunkError;

    // 3. Record event
    await supabase.from('ingestion_events').insert({
      event_type: `DOCUMENT_${action}ED`,
      document_id: documentId,
      description: `Admin ${action.toLowerCase()}ed document. Status changed to ${newStatus}.`
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
