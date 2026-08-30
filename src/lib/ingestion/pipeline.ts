/**
 * BIS Compliance Assistant — Discovery & Ingestion Orchestrator
 * 
 * Separates Discovery (Phase 1) from Ingestion (Phase 2).
 * Ensures that no document is extracted, chunked, or embedded without explicit
 * human admin verification of the candidate source.
 */

import { getAdminSupabase } from '../db/supabaseClient';
import { getEmbedding } from '../ai/embedding';
import { DEFAULT_TRUSTED_SOURCES } from './sourceRegistry';
import { discoverSources } from './discovery';
import { fetchDocument } from './fetcher';
import { extractContent } from './extractor';
import { chunkDocument } from './chunker';
import { detectChanges } from './changeDetector';
import type { IngestionInput, IngestionJob, IngestionLogEntry } from './types';

// ─── 1. DISCOVERY PHASE ─────────────────────────────────

export async function runDiscoveryPipeline(
  input: IngestionInput,
  triggerType: IngestionJob['triggerType']
): Promise<string> {
  const supabase = getAdminSupabase();
  if (!supabase) throw new Error('Database connection required for ingestion');

  const { data: job, error: jobError } = await supabase
    .from('ingestion_jobs')
    .insert({
      trigger_type: triggerType,
      status: 'RUNNING',
      sources_discovered: 0,
      errors: 0,
      log: [{ timestamp: new Date().toISOString(), level: 'info', message: 'Discovery pipeline started' }],
    })
    .select('id')
    .single();

  if (jobError || !job) throw new Error(`Failed to create job: ${jobError?.message}`);

  // Background execution
  processDiscovery(job.id, input).catch(err => {
    console.error(`Discovery ${job.id} failed completely:`, err);
  });

  return job.id;
}

async function processDiscovery(jobId: string, input: IngestionInput) {
  const supabase = getAdminSupabase();
  const logs: IngestionLogEntry[] = [];
  let discovered = 0;
  let errors = 0;

  const addLog = (level: 'info' | 'warn' | 'error', message: string, url?: string, error?: string) => {
    logs.push({ timestamp: new Date().toISOString(), level, message, url, error });
    if (level === 'error') errors++;
  };

  try {
    addLog('info', `Starting discovery for input: ${JSON.stringify(input)}`);
    
    const { data: dbSources } = await supabase!.from('trusted_sources').select('*').eq('enabled', true);
    const sources = dbSources && dbSources.length > 0 ? dbSources : DEFAULT_TRUSTED_SOURCES;

    const discoveredUrls = await discoverSources(input, sources as any);
    addLog('info', `Discovered ${discoveredUrls.length} candidate URLs`);

    for (const item of discoveredUrls) {
      try {
        const { data: existing } = await supabase!
          .from('source_documents')
          .select('id')
          .eq('source_url', item.url)
          .single();

        if (!existing) {
          await supabase!.from('source_documents').insert({
            source_url: item.url,
            source_domain: item.domain,
            document_type: 'UNKNOWN',
            verification_status: 'PENDING_REVIEW', // STRICT RULE: Must be pending review
            authoritative: false,                  // STRICT RULE: Must be false
            discovered_by: item.discoveryMethod,
            title: `Candidate Document from ${item.domain}`, // Placeholder until extracted
            standard_number: item.standardNumber || null,
          });
          discovered++;
          addLog('info', `Added candidate document`, item.url);
        } else {
          addLog('info', `Candidate already exists in system, skipping`, item.url);
        }
      } catch (err: any) {
        addLog('error', `Failed to record candidate`, item.url, err.message);
      }
    }

    addLog('info', 'Discovery completed successfully');
  } catch (err: any) {
    addLog('error', 'Discovery failed catastrophically', undefined, err.message);
  } finally {
    await supabase!.from('ingestion_jobs').update({
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
      sources_discovered: discovered,
      errors,
      log: logs,
    }).eq('id', jobId);
  }
}

// ─── 2. INGESTION PHASE (POST-VERIFICATION) ─────────────

export async function runIngestionForDocument(documentId: string): Promise<void> {
  const supabase = getAdminSupabase();
  if (!supabase) throw new Error('Database connection required for ingestion');

  // 1. Fetch document and confirm it is verified
  const { data: doc, error: docErr } = await supabase
    .from('source_documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (docErr || !doc) throw new Error('Document not found');

  if (doc.verification_status !== 'AUTHORITATIVE' || doc.authoritative !== true) {
    throw new Error('SAFETY VIOLATION: Cannot ingest document. It has not been explicitly verified by an admin.');
  }

  // 2. Create the ingestion_jobs record
  const { data: job, error: jobError } = await supabase
    .from('ingestion_jobs')
    .insert({
      trigger_type: 'ADMIN',
      status: 'RUNNING',
      sources_fetched: 0,
      documents_created: 0,
      documents_updated: 0,
      chunks_created: 0,
      embeddings_generated: 0,
      errors: 0,
      log: [{ timestamp: new Date().toISOString(), level: 'info', message: `Starting ingestion for verified document: ${doc.source_url}` }],
    })
    .select('id')
    .single();

  if (jobError || !job) {
    throw new Error(`Failed to create ingestion job: ${jobError?.message}`);
  }

  const jobId = job.id;
  const logs: IngestionLogEntry[] = [{ timestamp: new Date().toISOString(), level: 'info', message: `Starting ingestion for verified document: ${doc.source_url}` }];
  let chunksCreated = 0;
  let errors = 0;

  const addLog = (level: 'info' | 'warn' | 'error', message: string, error?: string) => {
    logs.push({ timestamp: new Date().toISOString(), level, message, error });
    if (level === 'error') errors++;
  };

  try {
    addLog('info', 'Processing URL: ' + doc.source_url);
    const { data: dbSources } = await supabase.from('trusted_sources').select('*').eq('enabled', true);
    const sources = dbSources && dbSources.length > 0 ? dbSources : DEFAULT_TRUSTED_SOURCES;

    // 2. Fetch Source
    addLog('info', 'Fetching document...');
    const fetchResult = await fetchDocument(doc.source_url, sources as any);
    const changes = await detectChanges(fetchResult.url, fetchResult.contentHash);

    // 3. Extract Content
    addLog('info', 'Extracting text...');
    const extraction = await extractContent(
      fetchResult.rawContent,
      fetchResult.contentType,
      fetchResult.url
    );

    if (extraction.metadata.extractionFailed) {
      throw new Error(`Extraction failed: ${extraction.metadata.failureReason}`);
    }

    // 4. Update Document Metadata with actual extracted values
    await supabase.from('source_documents').update({
      title: extraction.title || doc.title,
      standard_number: extraction.standardNumber || doc.standard_number,
      document_type: fetchResult.contentType,
      last_checked_at: fetchResult.retrievedAt,
    }).eq('id', documentId);

    // 5. Store Version
    await supabase.from('source_document_versions').insert({
      document_id: documentId,
      version_number: changes.versionNumber,
      content_hash: fetchResult.contentHash,
      raw_content: typeof fetchResult.rawContent === 'string' ? fetchResult.rawContent : null,
      extracted_text: extraction.extractedText,
      page_count: extraction.pageCount,
      retrieved_at: fetchResult.retrievedAt,
      is_current: true,
      metadata: extraction.metadata,
    });

    // 6. Chunk and Embed
    addLog('info', 'Chunking...');
    await supabase.from('ingestion_jobs').update({
      sources_fetched: 1,
      documents_updated: 1,
      log: logs,
    }).eq('id', jobId);

    await supabase.from('bis_chunks').delete().eq('source_document_id', documentId);

    const chunks = chunkDocument(extraction, fetchResult.url, documentId);
    
    addLog('info', `Generating embeddings and saving ${chunks.length} chunks...`);
    for (const chunk of chunks) {
      const embeddingText = `${chunk.content} ${chunk.sectionTitle ?? ''} ${chunk.clauseNumber ?? ''} ${chunk.standardNumber ?? ''}`;
      const embedding = await getEmbedding(embeddingText);

      await supabase.from('bis_chunks').insert({
        source_document_id: documentId,
        standard_number: chunk.standardNumber,
        clause: chunk.clauseNumber,
        section_title: chunk.sectionTitle,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding,
        // Provenance is derived dynamically at query time via JOIN against source_documents
      });
    }

    chunksCreated = chunks.length;
    addLog('info', `Successfully ingested and embedded ${chunks.length} chunks.`);

    // 7. Success Audit Log
    await supabase.from('ingestion_events').insert({
      event_type: 'DOCUMENT_INGESTED',
      document_id: documentId,
      description: `Successfully ingested and embedded ${chunks.length} chunks.`,
    });

  } catch (error: any) {
    // Audit Log on Failure
    addLog('error', `Ingestion failed: ${error.message}`);
    await supabase.from('ingestion_events').insert({
      event_type: 'INGESTION_FAILED',
      document_id: documentId,
      description: `Ingestion failed: ${error.message}`,
    });
  } finally {
    // 8. Update Job Record
    await supabase.from('ingestion_jobs').update({
      status: errors > 0 ? 'FAILED' : 'COMPLETED',
      completed_at: new Date().toISOString(),
      sources_fetched: errors > 0 ? 0 : 1,
      documents_updated: errors > 0 ? 0 : 1,
      chunks_created: chunksCreated,
      embeddings_generated: chunksCreated,
      errors,
      log: logs,
    }).eq('id', jobId);
  }
}
