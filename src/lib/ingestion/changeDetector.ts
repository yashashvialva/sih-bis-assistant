/**
 * BIS Compliance Assistant — Change Detector
 * 
 * Detects when a previously indexed document has changed
 * using content hashes. Creates new versions for changed
 * documents while preserving old versions.
 */

import { supabase } from '../db/supabaseClient';

export interface ChangeDetectionResult {
  isNew: boolean;
  isChanged: boolean;
  isUnchanged: boolean;
  existingDocumentId?: string;
  existingVersionId?: string;
  previousHash?: string;
  currentHash: string;
  versionNumber: number;
}

/**
 * Check if a document URL already exists in the database,
 * and if so, whether the content has changed.
 */
export async function detectChanges(
  sourceUrl: string,
  contentHash: string
): Promise<ChangeDetectionResult> {
  if (!supabase) {
    // No database — treat as new
    return {
      isNew: true,
      isChanged: false,
      isUnchanged: false,
      currentHash: contentHash,
      versionNumber: 1,
    };
  }

  // Look up existing document by URL
  const { data: existingDoc, error: docError } = await supabase
    .from('source_documents')
    .select('id')
    .eq('source_url', sourceUrl)
    .maybeSingle();

  if (docError || !existingDoc) {
    return {
      isNew: true,
      isChanged: false,
      isUnchanged: false,
      currentHash: contentHash,
      versionNumber: 1,
    };
  }

  // Check the latest version's hash
  const { data: latestVersion, error: verError } = await supabase
    .from('source_document_versions')
    .select('id, content_hash, version_number')
    .eq('document_id', existingDoc.id)
    .eq('is_current', true)
    .maybeSingle();

  if (verError || !latestVersion) {
    // Document exists but no version — treat as new version
    return {
      isNew: false,
      isChanged: true,
      isUnchanged: false,
      existingDocumentId: existingDoc.id,
      currentHash: contentHash,
      versionNumber: 1,
    };
  }

  // Compare hashes
  if (latestVersion.content_hash === contentHash) {
    return {
      isNew: false,
      isChanged: false,
      isUnchanged: true,
      existingDocumentId: existingDoc.id,
      existingVersionId: latestVersion.id,
      previousHash: latestVersion.content_hash,
      currentHash: contentHash,
      versionNumber: latestVersion.version_number,
    };
  }

  // Content has changed
  return {
    isNew: false,
    isChanged: true,
    isUnchanged: false,
    existingDocumentId: existingDoc.id,
    existingVersionId: latestVersion.id,
    previousHash: latestVersion.content_hash,
    currentHash: contentHash,
    versionNumber: latestVersion.version_number + 1,
  };
}
