/**
 * Google Maps Helpers
 * 
 * Generates URLs for Google Maps directions using verified laboratory data.
 */

export interface LocationInfo {
  latitude?: number | null;
  longitude?: number | null;
}

export interface LaboratoryLocationData {
  name: string;
  address: string;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Generate a Google Maps Directions URL for a given laboratory.
 * 
 * 1. Prefers verified latitude/longitude if available.
 * 2. Otherwise constructs a destination string using all available address fields.
 * 3. Optionally includes the user's current location as the origin.
 * 
 * @param laboratory The laboratory data
 * @param userLocation Optional user location to use as origin
 * @returns URL string for Google Maps Directions
 */
export function getGoogleMapsDirectionsUrl(
  laboratory: LaboratoryLocationData,
  userLocation?: LocationInfo | null
): string {
  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  let destination = '';

  // Prefer coordinates if we have legitimately verified ones
  if (laboratory.latitude && laboratory.longitude) {
    destination = `${laboratory.latitude},${laboratory.longitude}`;
  } else {
    // Construct address from available fields
    const addressParts = [
      laboratory.name,
      laboratory.address,
      laboratory.city,
      laboratory.district,
      laboratory.state,
      laboratory.pincode,
    ];

    // Filter out empty/null values and join with commas
    destination = addressParts
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .join(', ');
  }

  const url = new URL(baseUrl);
  url.searchParams.set('destination', destination);

  // Add user origin if available
  if (userLocation?.latitude && userLocation?.longitude) {
    url.searchParams.set('origin', `${userLocation.latitude},${userLocation.longitude}`);
  }

  return url.toString();
}
