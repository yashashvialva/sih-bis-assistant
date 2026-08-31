import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/db/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB Error' }, { status: 500 });

    const { data: amendments, error } = await supabase
      .from('amendments')
      .select('*')
      .order('published_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ amendments: amendments || [] });
  } catch (err: any) {
    console.error('Failed to fetch amendments:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
