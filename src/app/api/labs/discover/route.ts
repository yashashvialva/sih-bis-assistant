import { NextResponse } from 'next/server';
import { getCachedLabs, startLabDiscovery } from '@/lib/bis-lims/discovery';
import { findStateId } from '@/lib/bis-lims/stateMapping';

/**
 * POST /api/labs/discover
 * 
 * Discovers BIS Recognized Laboratories for a given state.
 * Returns cached data if fresh, otherwise starts a background scraping job.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { state } = body;

    if (!state || typeof state !== 'string') {
      return NextResponse.json(
        { error: 'State is required.' },
        { status: 400 }
      );
    }

    // Validate state exists in BIS LIMS registry
    const stateId = findStateId(state);
    if (stateId === null) {
      return NextResponse.json(
        { error: `"${state}" is not a recognized state in the BIS LIMS registry.` },
        { status: 400 }
      );
    }

    // Check cache
    const cached = await getCachedLabs(state);

    if (cached.isFresh) {
      // Data is fresh, return immediately
      return NextResponse.json({
        labs: cached.labs,
        cached: true,
        lastScraped: cached.lastScraped,
        jobId: null,
        message: `Showing ${cached.labs.length} cached BIS LIMS laboratories for ${state}.`,
      });
    }

    // Data is stale or missing — start background discovery
    let jobId: string | null = null;
    try {
      jobId = await startLabDiscovery(state);
    } catch (err: any) {
      // If discovery fails to start, still return cached data if available
      if (cached.labs.length > 0) {
        return NextResponse.json({
          labs: cached.labs,
          cached: true,
          lastScraped: cached.lastScraped,
          jobId: null,
          message: `Live BIS LIMS refresh is temporarily unavailable. Showing previously retrieved BIS data.`,
          warning: err.message,
        });
      }
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // Return cached data (if any) + job ID for polling
    return NextResponse.json({
      labs: cached.labs,
      cached: cached.labs.length > 0,
      lastScraped: cached.lastScraped,
      jobId,
      message: cached.labs.length > 0
        ? `Showing ${cached.labs.length} cached labs. Refreshing from BIS LIMS...`
        : `Discovering BIS Recognized Laboratories for ${state}...`,
    });

  } catch (error: any) {
    console.error('API /labs/discover error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
