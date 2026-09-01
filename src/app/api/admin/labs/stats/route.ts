import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/db/supabaseClient';

/**
 * GET /api/admin/labs/stats
 * Returns aggregate statistics about discovered labs.
 */
export async function GET() {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    // Get total labs from BIS LIMS
    const { count: totalLabs } = await supabase
      .from('laboratories')
      .select('*', { count: 'exact', head: true })
      .eq('source_type', 'BIS_LIMS');

    // Get total scopes
    const { count: totalScopes } = await supabase
      .from('laboratory_scopes')
      .select('*', { count: 'exact', head: true });

    // Get per-state stats
    const { data: labs } = await supabase
      .from('laboratories')
      .select('state, last_scraped_at')
      .eq('source_type', 'BIS_LIMS');

    const stateMap: Record<string, { count: number; lastScraped: string | null }> = {};
    if (labs) {
      for (const lab of labs) {
        const state = lab.state || 'Unknown';
        if (!stateMap[state]) {
          stateMap[state] = { count: 0, lastScraped: null };
        }
        stateMap[state].count++;
        if (lab.last_scraped_at) {
          if (!stateMap[state].lastScraped || new Date(lab.last_scraped_at) > new Date(stateMap[state].lastScraped!)) {
            stateMap[state].lastScraped = lab.last_scraped_at;
          }
        }
      }
    }

    const states = Object.entries(stateMap)
      .map(([state, data]) => ({
        state,
        lab_count: data.count,
        last_scraped: data.lastScraped,
      }))
      .sort((a, b) => a.state.localeCompare(b.state));

    return NextResponse.json({
      totalLabs: totalLabs || 0,
      totalScopes: totalScopes || 0,
      states,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
