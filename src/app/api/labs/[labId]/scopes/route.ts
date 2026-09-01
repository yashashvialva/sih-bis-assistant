import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/db/supabaseClient';

/**
 * GET /api/labs/[labId]/scopes
 * 
 * Returns scope records (standards/products) for a specific laboratory.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    const { labId } = await params;
    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const { data: scopes, error } = await supabase
      .from('laboratory_scopes')
      .select('*')
      .eq('laboratory_id', labId)
      .order('standard_number', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch scopes.' }, { status: 500 });
    }

    return NextResponse.json({ scopes: scopes || [] });
  } catch (error: any) {
    console.error('API /labs/[labId]/scopes error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
