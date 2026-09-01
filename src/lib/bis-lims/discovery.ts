/**
 * BIS LIMS Lab Discovery Orchestrator
 * 
 * Manages the end-to-end flow:
 * 1. Create discovery job
 * 2. Scrape BIS LIMS for the requested state
 * 3. Upsert laboratories into Supabase
 * 4. Queue scope scraping
 * 5. Update job status
 * 
 * SAFETY:
 * - Never deletes existing data if BIS is unavailable
 * - Never fabricates data
 * - Idempotent upserts using lab_code
 */

import { getAdminSupabase } from '../db/supabaseClient';
import { findStateId } from './stateMapping';
import { scrapeLabsForState } from './scraper';
import { scrapeLabScope } from './scopeScraper';
import type { BISLab, LabDiscoveryLogEntry } from './types';

const CACHE_FRESHNESS_HOURS = 24;

/**
 * Check if cached data exists and is fresh for a given state.
 */
export async function getCachedLabs(state: string): Promise<{
  labs: any[];
  isFresh: boolean;
  lastScraped: string | null;
}> {
  const supabase = getAdminSupabase();
  if (!supabase) return { labs: [], isFresh: false, lastScraped: null };

  const { data: labs, error } = await supabase
    .from('laboratories')
    .select('*')
    .eq('state', state)
    .eq('source_type', 'BIS_LIMS')
    .order('name', { ascending: true });

  if (error || !labs || labs.length === 0) {
    return { labs: [], isFresh: false, lastScraped: null };
  }

  // Check freshness based on last_scraped_at
  const latestScrape = labs.reduce((latest: string | null, lab: any) => {
    if (!lab.last_scraped_at) return latest;
    if (!latest) return lab.last_scraped_at;
    return new Date(lab.last_scraped_at) > new Date(latest) ? lab.last_scraped_at : latest;
  }, null);

  let isFresh = false;
  if (latestScrape) {
    const hoursSince = (Date.now() - new Date(latestScrape).getTime()) / (1000 * 60 * 60);
    isFresh = hoursSince < CACHE_FRESHNESS_HOURS;
  }

  return { labs, isFresh, lastScraped: latestScrape };
}

/**
 * Start a background lab discovery job for a given state.
 * Returns the job ID immediately.
 */
export async function startLabDiscovery(state: string): Promise<string> {
  const supabase = getAdminSupabase();
  if (!supabase) throw new Error('Database not configured');

  const stateId = findStateId(state);
  if (stateId === null) {
    throw new Error(`Unknown state: "${state}". Not found in BIS LIMS state registry.`);
  }

  // Create job record
  const { data: job, error: jobError } = await supabase
    .from('lab_discovery_jobs')
    .insert({
      state,
      status: 'RUNNING',
      logs: [{ timestamp: new Date().toISOString(), level: 'info', message: `Starting BIS LIMS discovery for ${state} (state_id=${stateId})` }],
    })
    .select('id')
    .single();

  if (jobError || !job) {
    throw new Error(`Failed to create discovery job: ${jobError?.message}`);
  }

  // Run in background (don't await)
  processDiscovery(job.id, state, stateId).catch(err => {
    console.error(`Lab discovery job ${job.id} failed:`, err);
  });

  return job.id;
}

/**
 * Background processing: scrape, upsert, and update job.
 */
async function processDiscovery(jobId: string, state: string, stateId: number) {
  const supabase = getAdminSupabase();
  if (!supabase) return;

  const logs: LabDiscoveryLogEntry[] = [
    { timestamp: new Date().toISOString(), level: 'info', message: `Starting BIS LIMS discovery for ${state}` }
  ];
  let labsInserted = 0;
  let labsUpdated = 0;
  let labsFound = 0;
  let pagesDiscovered = 0;
  let scopeRecordsFound = 0;
  let errors = 0;

  const addLog = (level: 'info' | 'warn' | 'error', message: string, error?: string) => {
    logs.push({ timestamp: new Date().toISOString(), level, message, error });
    if (level === 'error') errors++;
  };

  try {
    // 1. Scrape BIS LIMS
    addLog('info', `Fetching labs from BIS LIMS (state_id=${stateId})...`);
    
    const result = await scrapeLabsForState(stateId, (page, count) => {
      addLog('info', `Scraped page ${page}, ${count} labs so far`);
    });

    labsFound = result.labs.length;
    pagesDiscovered = result.pagesScraped;
    addLog('info', `BIS LIMS returned ${result.totalResults} results, scraped ${labsFound} labs from ${pagesDiscovered} pages`);

    // 2. Upsert laboratories
    for (const lab of result.labs) {
      try {
        const upserted = await upsertLaboratory(supabase, lab, state);
        if (upserted === 'inserted') labsInserted++;
        else if (upserted === 'updated') labsUpdated++;
      } catch (err: any) {
        addLog('error', `Failed to upsert lab ${lab.lab_code}: ${err.message}`);
      }
    }
    addLog('info', `Upserted ${labsInserted} new, ${labsUpdated} updated laboratories`);

    // Update job with intermediate progress
    await supabase.from('lab_discovery_jobs').update({
      labs_found: labsFound,
      labs_inserted: labsInserted,
      labs_updated: labsUpdated,
      pages_discovered: pagesDiscovered,
      logs,
    }).eq('id', jobId);

    // 3. Scrape scopes in background
    addLog('info', 'Starting scope extraction...');
    for (const lab of result.labs) {
      if (!lab.scope_url) continue;

      try {
        const scopes = await scrapeLabScope(lab.scope_url);
        if (scopes.length > 0) {
          // Find the lab ID in our database
          const { data: dbLab } = await supabase
            .from('laboratories')
            .select('id')
            .eq('lab_code', lab.lab_code)
            .single();

          if (dbLab) {
            for (const scope of scopes) {
              await upsertScope(supabase, dbLab.id, scope);
              scopeRecordsFound++;
            }
          }
        }
        addLog('info', `Extracted ${scopes.length} scope records for ${lab.name}`);
      } catch (err: any) {
        addLog('warn', `Scope scraping failed for ${lab.name}: ${err.message}`);
      }

      // Throttle scope requests
      await new Promise(r => setTimeout(r, 500));
    }

    addLog('info', `Discovery completed. ${labsFound} labs, ${scopeRecordsFound} scope records.`);
  } catch (err: any) {
    addLog('error', `Discovery failed: ${err.message}`, err.message);
  } finally {
    // Update final job status
    await supabase.from('lab_discovery_jobs').update({
      status: errors > 0 && labsFound === 0 ? 'FAILED' : 'COMPLETED',
      completed_at: new Date().toISOString(),
      pages_discovered: pagesDiscovered,
      labs_found: labsFound,
      labs_inserted: labsInserted,
      labs_updated: labsUpdated,
      scope_records_found: scopeRecordsFound,
      errors,
      logs,
    }).eq('id', jobId);
  }
}

/**
 * Upsert a single laboratory record.
 * Uses lab_code as the deduplication key.
 */
async function upsertLaboratory(
  supabase: any,
  lab: BISLab,
  discoveredState: string
): Promise<'inserted' | 'updated'> {
  const now = new Date().toISOString();

  if (!lab.lab_code) {
    // Fallback dedup key: normalized name + address
    const fallbackKey = `${lab.name}::${lab.address}`.toLowerCase().replace(/\s+/g, ' ');
    
    const { data: existing } = await supabase
      .from('laboratories')
      .select('id')
      .eq('name', lab.name)
      .eq('source_type', 'BIS_LIMS')
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase.from('laboratories').update({
        address: lab.address,
        city: lab.city,
        district: lab.district,
        state: lab.state || discoveredState,
        pincode: lab.pincode,
        contact_person: lab.contact_person,
        contact_number: lab.contact_number,
        email: lab.email,
        validity_date: lab.validity_date,
        scope_url: lab.scope_url,
        source_url: lab.source_url,
        source_type: 'BIS_LIMS',
        verification_status: 'BIS_RECOGNIZED',
        last_scraped_at: now,
        updated_at: now,
      }).eq('id', existing[0].id);

      return 'updated';
    }
  }

  // Try to find existing by lab_code
  if (lab.lab_code) {
    const { data: existing } = await supabase
      .from('laboratories')
      .select('id')
      .eq('lab_code', lab.lab_code)
      .single();

    if (existing) {
      await supabase.from('laboratories').update({
        name: lab.name,
        address: lab.address,
        city: lab.city,
        district: lab.district,
        state: lab.state || discoveredState,
        pincode: lab.pincode,
        contact_person: lab.contact_person,
        contact_number: lab.contact_number,
        email: lab.email,
        validity_date: lab.validity_date,
        scope_url: lab.scope_url,
        source_url: lab.source_url,
        source_type: 'BIS_LIMS',
        verification_status: 'BIS_RECOGNIZED',
        last_scraped_at: now,
        updated_at: now,
      }).eq('id', existing.id);

      return 'updated';
    }
  }

  // Insert new
  await supabase.from('laboratories').insert({
    lab_code: lab.lab_code || null,
    name: lab.name,
    address: lab.address,
    city: lab.city,
    district: lab.district,
    state: lab.state || discoveredState,
    pincode: lab.pincode,
    contact_person: lab.contact_person,
    contact_number: lab.contact_number,
    email: lab.email,
    validity_date: lab.validity_date,
    scope_url: lab.scope_url,
    source_url: lab.source_url,
    source_type: 'BIS_LIMS',
    verification_status: 'BIS_RECOGNIZED',
    last_scraped_at: now,
  });

  return 'inserted';
}

/**
 * Upsert a single scope record.
 */
async function upsertScope(supabase: any, laboratoryId: string, scope: any) {
  // Try to find existing
  const { data: existing } = await supabase
    .from('laboratory_scopes')
    .select('id')
    .eq('laboratory_id', laboratoryId)
    .eq('standard_number', scope.standard_number || '')
    .eq('product', scope.product || '')
    .eq('grade_type_size', scope.grade_type_size || '')
    .limit(1);

  const now = new Date().toISOString();

  if (existing && existing.length > 0) {
    await supabase.from('laboratory_scopes').update({
      testing_charges: scope.testing_charges,
      validity_date: scope.validity_date,
      remark: scope.remark,
      source_url: scope.source_url,
      scraped_at: now,
      updated_at: now,
    }).eq('id', existing[0].id);
  } else {
    await supabase.from('laboratory_scopes').insert({
      laboratory_id: laboratoryId,
      standard_number: scope.standard_number || '',
      product: scope.product || '',
      grade_type_size: scope.grade_type_size || '',
      testing_charges: scope.testing_charges,
      validity_date: scope.validity_date,
      remark: scope.remark,
      source_url: scope.source_url,
      scraped_at: now,
    });
  }
}
