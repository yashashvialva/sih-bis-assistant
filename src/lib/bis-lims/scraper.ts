/**
 * BIS LIMS Lab Scraper
 * 
 * Scrapes laboratory data from https://lims.bis.gov.in/home/labs/
 * Handles pagination and extracts structured data from the HTML table.
 * 
 * SAFETY:
 * - Does not bypass CAPTCHA or authentication
 * - Uses normal HTTP requests with reasonable throttling
 * - Does not fabricate any data
 */

import * as cheerio from 'cheerio';
import type { BISLab } from './types';

const BIS_LIMS_BASE = 'https://lims.bis.gov.in';
const LABS_URL = `${BIS_LIMS_BASE}/home/labs/`;
const REQUEST_DELAY_MS = 1000; // 1 second between requests
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;

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
        throw new Error(`Failed to fetch ${url} after ${retries} attempts: ${err.message}`);
      }
      // Exponential backoff
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
  throw new Error('Unreachable');
}

/**
 * Parse a single page of BIS LIMS lab results HTML.
 */
function parseLabsPage(html: string): { labs: BISLab[]; totalResults: number; hasNextPage: boolean; currentPage: number } {
  const $ = cheerio.load(html);
  const labs: BISLab[] = [];

  // Extract total result count
  const countsText = $('.counts').text().trim(); // e.g. "431 Results" or "0 Results"
  const totalResults = parseInt(countsText) || 0;

  // Parse table rows
  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 8) return; // Skip malformed rows

    // Column 0: S.NO (skip)
    // Column 1: LAB CODE
    const labCode = $(cells[1]).text().trim();
    
    // Column 2: LAB NAME (inside td with class text-left)
    const nameCell = $(cells[2]);
    // Remove the img element to get just the name text
    nameCell.find('img').remove();
    const name = nameCell.text().trim();

    // Column 3: ADDRESS (contains multi-line address with city, district, state, pincode)
    const rawAddress = $(cells[3]).text().trim();
    const addressParts = parseAddress(rawAddress);

    // Column 4: CONTACT PERSON
    const contactPerson = $(cells[4]).text().trim() || null;

    // Column 5: CONTACT NUMBER
    const contactNumber = $(cells[5]).text().trim() || null;

    // Column 6: EMAIL
    const email = $(cells[6]).text().trim() || null;

    // Column 7: VALIDITY DATE
    const validityDate = $(cells[7]).text().trim() || null;

    // Column 8: VIEW SCOPE (link)
    const scopeLink = $(cells[8]).find('a').attr('href') || null;
    const scopeUrl = scopeLink ? `${BIS_LIMS_BASE}${scopeLink}` : null;

    // Determine source URL for this specific lab row
    const trId = $(row).attr('id'); // e.g. "tr_15"
    const labInternalId = trId ? trId.replace('tr_', '') : null;

    if (!labCode && !name) return; // Skip empty rows

    labs.push({
      lab_code: labCode,
      name,
      address: addressParts.fullAddress,
      city: addressParts.city,
      district: addressParts.district,
      state: addressParts.state,
      pincode: addressParts.pincode,
      contact_person: contactPerson === '-' ? null : contactPerson,
      contact_number: contactNumber === '-' ? null : contactNumber,
      email: email === '-' ? null : email,
      validity_date: validityDate === '-' ? null : validityDate,
      scope_url: scopeUrl,
      source_url: LABS_URL,
    });
  });

  // Check pagination
  const paginationLinks = $('ul.pagination a');
  let currentPage = 1;
  let hasNextPage = false;

  paginationLinks.each((_, link) => {
    const text = $(link).text().trim();
    if ($(link).hasClass('active') || $(link).parent().find('.active').length > 0) {
      const pageNum = parseInt(text);
      if (!isNaN(pageNum)) currentPage = pageNum;
    }
    if (text === 'Next') {
      hasNextPage = true;
    }
  });

  // Also check if there's a page with 'active' class
  $('ul.pagination .active').each((_, el) => {
    const pageText = $(el).text().trim();
    const pageNum = parseInt(pageText);
    if (!isNaN(pageNum)) currentPage = pageNum;
  });

  return { labs, totalResults, hasNextPage, currentPage };
}

/**
 * Parse the multi-line BIS address format:
 * "Street Address,\n City,\n District,\n State,\n India - Pincode"
 */
function parseAddress(raw: string): {
  fullAddress: string;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
} {
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let city: string | null = null;
  let district: string | null = null;
  let state: string | null = null;
  let pincode: string | null = null;

  // The format is typically:
  // Line 0: Street address,
  // Line 1: City,
  // Line 2: District,
  // Line 3: State,
  // Line 4: India - Pincode
  if (lines.length >= 2) {
    // Try to extract pincode from last line
    const lastLine = lines[lines.length - 1];
    const pincodeMatch = lastLine.match(/(\d{6})/);
    if (pincodeMatch) {
      pincode = pincodeMatch[1];
    }

    // Work backwards from the India line
    for (let i = lines.length - 1; i >= 0; i--) {
      const clean = lines[i].replace(/,$/, '').trim();
      if (clean.startsWith('India')) continue;
      if (!state) { state = clean; continue; }
      if (!district) { district = clean; continue; }
      if (!city) { city = clean; break; }
    }
  }

  return {
    fullAddress: raw.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
    city: city && city !== ',' ? city.replace(/,$/, '').trim() : null,
    district: district ? district.replace(/,$/, '').trim() : null,
    state: state ? state.replace(/,$/, '').trim() : null,
    pincode,
  };
}

/**
 * Scrape ALL labs for a given BIS LIMS state ID.
 * Handles pagination automatically.
 * 
 * @param stateId - The BIS LIMS numeric state ID
 * @param onProgress - Optional callback for progress updates
 */
export async function scrapeLabsForState(
  stateId: number,
  onProgress?: (page: number, labsSoFar: number) => void
): Promise<{ labs: BISLab[]; pagesScraped: number; totalResults: number }> {
  const allLabs: BISLab[] = [];
  let page = 1;
  let totalResults = 0;

  while (true) {
    const url = `${LABS_URL}?lab_state=${stateId}&page=${page}`;
    
    const html = await fetchWithRetry(url);
    const result = parseLabsPage(html);

    if (page === 1) {
      totalResults = result.totalResults;
    }

    allLabs.push(...result.labs);
    onProgress?.(page, allLabs.length);

    if (!result.hasNextPage || result.labs.length === 0) {
      break;
    }

    page++;
    
    // Safety: prevent infinite loops
    if (page > 100) break;

    // Throttle requests
    await sleep(REQUEST_DELAY_MS);
  }

  return { labs: allLabs, pagesScraped: page, totalResults };
}
