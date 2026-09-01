/**
 * BIS LIMS Lab Discovery — Types
 */

/** A laboratory record as extracted from BIS LIMS */
export interface BISLab {
  lab_code: string;
  name: string;
  address: string;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  contact_person: string | null;
  contact_number: string | null;
  email: string | null;
  validity_date: string | null;
  scope_url: string | null;
  source_url: string;
}

/** A scope record from a lab's View Scope page */
export interface BISLabScope {
  standard_number: string | null;
  product: string | null;
  grade_type_size: string | null;
  testing_charges: string | null;
  validity_date: string | null;
  remark: string | null;
  source_url: string;
}

/** Job status for lab discovery */
export type LabDiscoveryStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

/** A lab discovery job record */
export interface LabDiscoveryJob {
  id: string;
  state: string;
  status: LabDiscoveryStatus;
  pages_discovered: number;
  labs_found: number;
  labs_inserted: number;
  labs_updated: number;
  scope_records_found: number;
  errors: number;
  logs: LabDiscoveryLogEntry[];
  started_at: string;
  completed_at: string | null;
}

export interface LabDiscoveryLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  error?: string;
}

/** BIS LIMS state mapping entry */
export interface BISStateEntry {
  id: number;
  name: string;
}
