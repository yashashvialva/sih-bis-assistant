/**
 * BIS LIMS State Mapping
 * 
 * Extracted directly from the BIS LIMS page at https://lims.bis.gov.in/home/labs/
 * The <select id="id_lab_state"> element contains these numeric IDs.
 * This mapping is authoritative and comes from the official BIS LIMS source.
 */

import type { BISStateEntry } from './types';

export const BIS_LIMS_STATES: BISStateEntry[] = [
  { id: 1, name: 'Uttar Pradesh' },
  { id: 2, name: 'Haryana' },
  { id: 3, name: 'Andaman & Nicobar' },
  { id: 4, name: 'Andhra Pradesh' },
  { id: 5, name: 'Arunachal Pradesh' },
  { id: 6, name: 'Assam' },
  { id: 7, name: 'Bihar' },
  { id: 8, name: 'Chandigarh' },
  { id: 9, name: 'Chhattisgarh' },
  { id: 10, name: 'Dadra & Nagar Haveli' },
  { id: 11, name: 'Daman & Diu' },
  { id: 12, name: 'Delhi' },
  { id: 13, name: 'Goa' },
  { id: 14, name: 'Gujarat' },
  { id: 15, name: 'Himachal Pradesh' },
  { id: 16, name: 'Jammu & Kashmir' },
  { id: 17, name: 'Jharkhand' },
  { id: 18, name: 'Karnataka' },
  { id: 19, name: 'Kerala' },
  { id: 20, name: 'Lakshadweep' },
  { id: 21, name: 'Madhya Pradesh' },
  { id: 22, name: 'Maharashtra' },
  { id: 23, name: 'Manipur' },
  { id: 24, name: 'Meghalaya' },
  { id: 25, name: 'Mizoram' },
  { id: 26, name: 'Nagaland' },
  { id: 27, name: 'Odisha' },
  { id: 28, name: 'Puducherry' },
  { id: 29, name: 'Punjab' },
  { id: 30, name: 'Rajasthan' },
  { id: 31, name: 'Sikkim' },
  { id: 32, name: 'Tamil Nadu' },
  { id: 33, name: 'Telangana' },
  { id: 34, name: 'Tripura' },
  { id: 35, name: 'Uttarakhand' },
  { id: 36, name: 'West Bengal' },
  { id: 52, name: 'Ladakh' },
  { id: 53, name: 'Pondichery' },
];

/**
 * Find the BIS LIMS numeric state ID for a given state name.
 * Uses case-insensitive fuzzy matching to handle variations from reverse geocoding.
 */
export function findStateId(stateName: string): number | null {
  const normalized = stateName.trim().toLowerCase();

  // Direct match first
  const direct = BIS_LIMS_STATES.find(
    s => s.name.toLowerCase() === normalized
  );
  if (direct) return direct.id;

  // Common aliases and variations from reverse geocoding
  const aliases: Record<string, string> = {
    'nct of delhi': 'Delhi',
    'national capital territory of delhi': 'Delhi',
    'new delhi': 'Delhi',
    'orissa': 'Odisha',
    'pondicherry': 'Puducherry',
    'andaman and nicobar': 'Andaman & Nicobar',
    'andaman and nicobar islands': 'Andaman & Nicobar',
    'dadra and nagar haveli': 'Dadra & Nagar Haveli',
    'dadra and nagar haveli and daman and diu': 'Dadra & Nagar Haveli',
    'daman and diu': 'Daman & Diu',
    'jammu and kashmir': 'Jammu & Kashmir',
  };

  const aliasMatch = aliases[normalized];
  if (aliasMatch) {
    return BIS_LIMS_STATES.find(s => s.name === aliasMatch)?.id ?? null;
  }

  // Partial match as a last resort
  const partial = BIS_LIMS_STATES.find(
    s => s.name.toLowerCase().includes(normalized) || normalized.includes(s.name.toLowerCase())
  );
  return partial?.id ?? null;
}

/**
 * Get sorted list of all state names for the UI dropdown
 */
export function getAllStateNames(): string[] {
  return BIS_LIMS_STATES.map(s => s.name).sort();
}
