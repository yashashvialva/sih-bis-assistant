import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/db/supabaseClient';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Find the standard mapping based on the product category
    const { data: mappings, error: mappingError } = await supabase
      .from('product_standard_mappings')
      .select(`
        *,
        source_documents (
          verification_status,
          authoritative
        )
      `)
      .eq('product_category', product.category);
      
    // Filter out mappings that are not authoritative
    let mappedStandards = mappings || [];
    mappedStandards = mappedStandards.filter(m => 
      m.source_documents && 
      m.source_documents.verification_status === 'AUTHORITATIVE' && 
      m.source_documents.authoritative === true
    );

    return NextResponse.json({ 
      product,
      mappedStandards
    });
  } catch (error: any) {
    console.error('API /products/[id] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    
    // The roadmaps and roadmap_steps tables have ON DELETE CASCADE so deleting product is sufficient
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API /products/[id] DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
