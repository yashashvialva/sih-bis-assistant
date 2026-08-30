import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/db/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { latitude, longitude, radiusKm, laboratoryType } = body;

    // Removed strict lat/lon validation to allow fallback queries

    const radius = typeof radiusKm === 'number' ? radiusKm : 50;
    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    let data, error;

    if (latitude && longitude) {
      // Query the nearby labs using the RPC function
      const rpcResponse = await supabase.rpc('get_nearby_labs', {
        user_lat: latitude,
        user_lon: longitude,
        radius_km: radius,
        lab_type_filter: laboratoryType && laboratoryType !== '' ? laboratoryType : null,
      });
      data = rpcResponse.data;
      error = rpcResponse.error;
    } else {
      // Fallback: Query by state/type without location
      let query = supabase
        .from('laboratories')
        .select('*')
        .in('verification_status', ['VERIFIED', 'ACCREDITED', 'BIS_RECOGNIZED']);

      if (body.state) {
        query = query.eq('state', body.state);
      }
      if (laboratoryType) {
        query = query.eq('laboratory_type', laboratoryType);
      }

      const queryResponse = await query;
      data = queryResponse.data;
      error = queryResponse.error;
    }

    if (error) {
      console.error('Error fetching nearby labs:', error);
      return NextResponse.json({ error: 'Failed to retrieve laboratories.' }, { status: 500 });
    }

    return NextResponse.json({
      labs: data || [],
      radiusKm: radius,
    });
  } catch (error) {
    console.error('API /labs/nearby error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
