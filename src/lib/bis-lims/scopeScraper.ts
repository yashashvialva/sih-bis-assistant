/**
 * BIS LIMS Scope Scraper
 * 
 * Extracts the "View Scope" table data from a lab-specific scope page.
 * e.g. https://lims.bis.gov.in/home_lab_scope/15/
 * 
 * SAFETY: Does not fabricate any scope data.
 */

import * as cheerio from 'cheerio';
import type { BISLabScope } from './types';

const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'BIS-Compliance-Assistant/1.0 (Educational Project)',
          'Accept': 'text/html',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (err: any) {
      if (attempt === retries) {
        throw new Error(`Failed to fetch scope page ${url} after ${retries} attempts: ${err.message}`);
      }
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
  throw new Error('Unreachable');
}

/**
 * Scrape scope data from a BIS LIMS lab scope page.
 * 
 * The scope page typically contains a table with columns:
 * S.NO | Indian Standard Number | Product | Grade/Type/Size/Designation | Testing Charges | Validity Date | Remarks
 */
export async function scrapeLabScope(scopeUrl: string): Promise<BISLabScope[]> {
  const scopes: BISLabScope[] = [];

  try {
    const html = await fetchWithRetry(scopeUrl);
    const $ = cheerio.load(html);

    // The scope table is inside a table element
    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 4) return; // Skip header or malformed rows

      // Column 0: S.NO (skip)
      // Column 1: Indian Standard Number
      const standardNumber = $(cells[1]).text().trim() || null;

      // Column 2: Product
      const product = $(cells[2]).text().trim() || null;

      // Column 3: Grade / Type / Size / Designation
      const gradeTypeSize = cells.length > 3 ? $(cells[3]).text().trim() || null : null;

      // Column 4: Testing Charges (if present)
      const testingCharges = cells.length > 4 ? $(cells[4]).text().trim() || null : null;

      // Column 5: Validity Date (if present)
      const validityDate = cells.length > 5 ? $(cells[5]).text().trim() || null : null;

      // Column 6: Remarks (if present)
      const remark = cells.length > 6 ? $(cells[6]).text().trim() || null : null;

      // Only add if we have a valid standard number
      if (standardNumber && standardNumber !== '-') {
        scopes.push({
          standard_number: standardNumber,
          product: product === '-' ? null : product,
          grade_type_size: gradeTypeSize === '-' ? null : gradeTypeSize,
          testing_charges: testingCharges === '-' ? null : testingCharges,
          validity_date: validityDate === '-' ? null : validityDate,
          remark: remark === '-' ? null : remark,
          source_url: scopeUrl,
        });
      }
    });
  } catch (err: any) {
    console.error(`Scope scraping failed for ${scopeUrl}:`, err.message);
    // Return empty — do not fabricate
  }

  return scopes;
}
