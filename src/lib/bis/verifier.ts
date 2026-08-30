export interface OfficialBISResult {
  status:
    | "VALID"
    | "INVALID"
    | "NOT_FOUND"
    | "EXPIRED"
    | "UNAVAILABLE"
    | "ERROR";
  licenceNumber: string;
  productName?: string;
  manufacturer?: string;
  standardNumber?: string;
  validityDate?: string;
  officialSourceUrl?: string;
  officialEvidence?: string;
  checkedAt: string;
}

/**
 * Adapter for checking a CM/L or R number against the Official BIS Verification System.
 */
export async function verifyWithOfficialBIS(licenceNumber: string): Promise<OfficialBISResult> {
  // IMPORTANT: The official BIS Verification portals (manakonline.in and crsbis.in)
  // are heavily protected by server-side CAPTCHAs and do not expose a public API 
  // for programmatic access. 
  // 
  // Per strict demo safety rules, we DO NOT substitute mock data or use third-party APIs
  // to pretend to have a live connection. We explicitly return UNAVAILABLE so the UI 
  // can direct the user to the official portal.

  // Simulate a realistic network delay before safely rejecting
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const isRNumber = licenceNumber.toUpperCase().startsWith('R-');
  const officialSourceUrl = isRNumber 
    ? 'https://www.crsbis.in/BIS/crsreglist.do'
    : 'https://www.manakonline.in/MANAK/ApplicationLicenceRelatedrpt#StatusofLicences';

  return {
    status: 'UNAVAILABLE',
    licenceNumber,
    officialSourceUrl,
    checkedAt: new Date().toISOString()
  };
}
