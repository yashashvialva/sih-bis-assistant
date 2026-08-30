import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/db/supabaseClient';
import type { Product } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // In demo mode without auth, we use the demo user ID
    const demoUserId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', demoUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ products: data });
  } catch (error: any) {
    console.error('API /products GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { name, category, description } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    const demoUserId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: demoUserId,
        name,
        category,
        description: description || ''
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product: data });
  } catch (error: any) {
    console.error('API /products POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
