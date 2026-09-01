'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Compass,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Phone,
  Mail,
  Calendar,
  Building2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getGoogleMapsDirectionsUrl, LocationInfo } from '@/lib/maps';

// All states from BIS LIMS (sorted)
const ALL_STATES = [
  'Andaman & Nicobar', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra & Nagar Haveli',
  'Daman & Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Pondichery', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];

interface Lab {
  id: string;
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
  source_type: string;
  verification_status: string;
  last_scraped_at: string | null;
}

type DiscoveryPhase = 'idle' | 'detecting_location' | 'discovering' | 'polling' | 'done' | 'error';

const getStateName = async (lat: number, lon: number): Promise<string | null> => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    return data.address?.state || null;
  } catch {
    return null;
  }
};

export default function LabsPage() {
  const { t } = useTranslation();

  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LocationInfo | null>(null);
  const [phase, setPhase] = useState<DiscoveryPhase>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [lastScraped, setLastScraped] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [expandedScopes, setExpandedScopes] = useState<Record<string, any[]>>({});
  const [loadingScopes, setLoadingScopes] = useState<Record<string, boolean>>({});
  const [scopePages, setScopePages] = useState<Record<string, number>>({});

  const SCOPES_PER_PAGE = 10;

  // Discover labs for a state
  const discoverLabs = useCallback(async (state: string) => {
    setPhase('discovering');
    setStatusMessage(`🔎 Searching BIS Recognized Laboratories in ${state}...`);
    setWarningMessage(null);

    try {
      const res = await fetch('/api/labs/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Discovery failed');

      setLabs(data.labs || []);
      setIsCached(data.cached);
      setLastScraped(data.lastScraped);

      if (data.warning) {
        setWarningMessage(data.warning);
      }

      if (data.jobId) {
        // Background job running — poll for updates
        setJobId(data.jobId);
        setPhase('polling');
        if (data.labs.length > 0) {
          setStatusMessage(`Showing ${data.labs.length} cached labs. Refreshing from BIS LIMS...`);
        } else {
          setStatusMessage(`Discovering laboratories from BIS LIMS...`);
        }
      } else {
        // Data was fresh/cached
        setPhase('done');
        if (data.labs.length === 0) {
          setStatusMessage(`No BIS Recognized Labs available for ${state}.`);
        } else {
          setStatusMessage(`${data.labs.length} BIS Recognized Labs found in ${state}.`);
        }
      }
    } catch (err: any) {
      setPhase('error');
      setStatusMessage(err.message || 'Failed to discover laboratories.');
    }
  }, []);

  // Poll for job progress
  useEffect(() => {
    if (phase !== 'polling' || !jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/labs/discover/${jobId}`);
        const data = await res.json();

        if (!res.ok) {
          clearInterval(interval);
          setPhase('error');
          setStatusMessage('Failed to check discovery progress.');
          return;
        }

        const job = data.job;

        if (job.status === 'COMPLETED' || job.status === 'FAILED') {
          clearInterval(interval);

          if (data.labs && data.labs.length > 0) {
            setLabs(data.labs);
          }

          if (job.status === 'FAILED' && labs.length === 0) {
            setPhase('error');
            setStatusMessage('Live BIS LIMS refresh is temporarily unavailable. Showing previously retrieved BIS data.');
            setWarningMessage('BIS LIMS may be temporarily down. Please try again later.');
          } else {
            setPhase('done');
            const state = selectedState || detectedState || '';
            const count = data.labs?.length || labs.length;
            if (count === 0) {
              setStatusMessage(`No BIS Recognized Labs available for ${state}.`);
            } else {
              setStatusMessage(`${count} BIS Recognized Labs found in ${state}.`);
            }
          }
          setIsCached(false);
          setLastScraped(new Date().toISOString());
        } else {
          // Still running — show progress
          setStatusMessage(
            `Discovering laboratories... ${job.labs_found || 0} found, ${job.pages_discovered || 0} pages scraped.`
          );
        }
      } catch {
        // Network error during poll — don't crash
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [phase, jobId, selectedState, detectedState, labs.length]);

  // Initial load: try geolocation
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setPhase('idle');
      return;
    }

    setPhase('detecting_location');
    setStatusMessage('📍 Detecting your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        const state = await getStateName(latitude, longitude);

        if (state) {
          setDetectedState(state);
          setSelectedState(state);
          discoverLabs(state);
        } else {
          setPhase('idle');
          setStatusMessage('Could not determine your state. Please select one manually.');
        }
      },
      () => {
        setUserLocation(null);
        setPhase('idle');
        setStatusMessage('Location access was unavailable. Please select a state manually.');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, [discoverLabs]);

  // Handle state dropdown change
  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    if (newState) {
      discoverLabs(newState);
    } else {
      setLabs([]);
      setPhase('idle');
      setStatusMessage('Select a state to discover BIS Recognized Laboratories.');
    }
  };

  // Toggle scope view for a lab
  const toggleScopes = async (labId: string) => {
    if (expandedScopes[labId]) {
      // Collapse
      const newScopes = { ...expandedScopes };
      delete newScopes[labId];
      setExpandedScopes(newScopes);
      
      const newPages = { ...scopePages };
      delete newPages[labId];
      setScopePages(newPages);
      return;
    }

    // Load scopes
    setLoadingScopes(prev => ({ ...prev, [labId]: true }));
    try {
      const res = await fetch(`/api/labs/${labId}/scopes`);
      const data = await res.json();
      setExpandedScopes(prev => ({ ...prev, [labId]: data.scopes || [] }));
      setScopePages(prev => ({ ...prev, [labId]: 1 }));
    } catch {
      setExpandedScopes(prev => ({ ...prev, [labId]: [] }));
      setScopePages(prev => ({ ...prev, [labId]: 1 }));
    } finally {
      setLoadingScopes(prev => ({ ...prev, [labId]: false }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          {t('labs.title')}
        </h1>
        <p className="text-muted-foreground mb-4">
          Discover BIS Recognized testing laboratories across India.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
          <CheckCircle size={14} />
          Source: Official BIS LIMS (lims.bis.gov.in)
        </div>
      </div>

      {/* State Selection */}
      <div className="bg-card border rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
              <MapPin size={14} className="inline mr-1" />
              State / Union Territory
            </label>
            <select
              className="input w-full bg-background"
              value={selectedState}
              onChange={e => handleStateChange(e.target.value)}
            >
              <option value="">
                {detectedState ? `Detected: ${detectedState}` : 'Select a State'}
              </option>
              {ALL_STATES.map(state => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {!detectedState && (
            <button
              onClick={() => {
                setPhase('detecting_location');
                setStatusMessage('📍 Detecting your location...');
                navigator.geolocation.getCurrentPosition(
                  async (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });
                    const state = await getStateName(latitude, longitude);
                    if (state) {
                      setDetectedState(state);
                      setSelectedState(state);
                      discoverLabs(state);
                    } else {
                      setPhase('idle');
                      setStatusMessage('Could not determine your state.');
                    }
                  },
                  () => {
                    setUserLocation(null);
                    setPhase('idle');
                    setStatusMessage('Location access denied. Please select a state.');
                  }
                );
              }}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 border h-10 bg-background hover:bg-muted text-foreground"
            >
              <Compass size={16} />
              Detect Location
            </button>
          )}
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`mt-4 text-sm font-medium flex items-center gap-2 ${
            phase === 'error' ? 'text-destructive' :
            phase === 'done' ? 'text-emerald-600 dark:text-emerald-400' :
            'text-muted-foreground'
          }`}>
            {(phase === 'detecting_location' || phase === 'discovering' || phase === 'polling') && (
              <Loader2 size={16} className="animate-spin" />
            )}
            {phase === 'error' && <AlertTriangle size={16} />}
            {phase === 'done' && <CheckCircle size={16} />}
            {statusMessage}
          </div>
        )}

        {/* Warning */}
        {warningMessage && (
          <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg border border-orange-200 dark:border-orange-800">
            <AlertTriangle size={12} className="inline mr-1" />
            {warningMessage}
          </div>
        )}

        {/* Cache info */}
        {isCached && lastScraped && (
          <div className="mt-2 text-xs text-muted-foreground">
            Last updated: {new Date(lastScraped).toLocaleString()} · Background refresh in progress
          </div>
        )}
      </div>

      {/* Lab Cards */}
      <div className="space-y-4">
        {(phase === 'detecting_location' || (phase === 'discovering' && labs.length === 0)) ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{phase === 'detecting_location' ? 'Detecting your location...' : 'Searching BIS LIMS...'}</p>
          </div>
        ) : phase === 'done' && labs.length === 0 && selectedState ? (
          <div className="card p-8 text-center bg-muted/30">
            <Building2 size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">
              No BIS Recognized Labs available for {selectedState}.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try selecting a different state from the dropdown above.
            </p>
          </div>
        ) : phase === 'idle' && labs.length === 0 ? (
          <div className="card p-8 text-center bg-muted/30">
            <Search size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">
              Select a state to discover BIS Recognized Laboratories.
            </p>
          </div>
        ) : (
          labs.map(lab => (
            <div key={lab.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <FlaskConical size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-lg text-foreground leading-tight">
                      {lab.name}
                    </h3>
                    <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                      <CheckCircle size={10} />
                      BIS RECOGNIZED
                    </span>
                  </div>

                  {/* Lab Code */}
                  {lab.lab_code && (
                    <div className="text-xs font-mono text-muted-foreground mb-2">
                      BIS Lab Code: {lab.lab_code}
                    </div>
                  )}

                  {/* Address */}
                  <p className="text-sm flex items-start gap-1.5 mb-3 text-muted-foreground max-w-2xl">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                    {lab.address}
                  </p>

                  {/* Contact Details Grid */}
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                    {lab.contact_person && (
                      <div className="bg-muted px-2.5 py-1 rounded-md border text-xs">
                        <span className="font-medium text-foreground">Contact: </span>
                        {lab.contact_person}
                      </div>
                    )}
                    {lab.contact_number && (
                      <a href={`tel:${lab.contact_number.replace(/\s/g, '')}`} className="bg-muted px-2.5 py-1 rounded-md border text-xs flex items-center gap-1 hover:bg-primary/10">
                        <Phone size={10} />
                        {lab.contact_number}
                      </a>
                    )}
                    {lab.email && (
                      <a href={`mailto:${lab.email}`} className="bg-muted px-2.5 py-1 rounded-md border text-xs flex items-center gap-1 hover:bg-primary/10">
                        <Mail size={10} />
                        {lab.email}
                      </a>
                    )}
                    {lab.validity_date && (
                      <div className="bg-muted px-2.5 py-1 rounded-md border text-xs flex items-center gap-1">
                        <Calendar size={10} />
                        Valid till: {lab.validity_date}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t">
                    <button
                      onClick={() => toggleScopes(lab.id)}
                      className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                    >
                      {loadingScopes[lab.id] ? (
                        <><Loader2 size={12} className="animate-spin" /> Loading scopes...</>
                      ) : expandedScopes[lab.id] ? (
                        <><ChevronUp size={12} /> Hide Supported Standards</>
                      ) : (
                        <><ChevronDown size={12} /> View Supported Standards</>
                      )}
                    </button>

                    <a
                      href={getGoogleMapsDirectionsUrl(
                        {
                          name: lab.name,
                          address: lab.address,
                          city: lab.city,
                          district: lab.district,
                          state: lab.state,
                          pincode: lab.pincode,
                          // Only pass lat/lon if they actually exist and are verified
                          latitude: (lab as any).latitude, 
                          longitude: (lab as any).longitude,
                        },
                        userLocation
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                    >
                      <MapPin size={12} /> Get Directions
                    </a>

                    {lab.source_url && (
                      <a
                        href={lab.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium ml-auto"
                      >
                        <ExternalLink size={12} />
                        View BIS Source
                      </a>
                    )}
                  </div>

                  {/* Expanded Scopes */}
                  {expandedScopes[lab.id] && (
                    <div className="mt-4 bg-muted/50 rounded-lg border p-4">
                      <h4 className="text-sm font-semibold mb-3">Supported Standards & Products</h4>
                      {expandedScopes[lab.id].length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No scope data available yet. Scope information may still be loading.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2 font-semibold">Standard</th>
                                <th className="text-left p-2 font-semibold">Product</th>
                                <th className="text-left p-2 font-semibold hidden sm:table-cell">Grade/Type/Size</th>
                                <th className="text-left p-2 font-semibold hidden md:table-cell">Charges</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expandedScopes[lab.id]
                                .slice(
                                  ((scopePages[lab.id] || 1) - 1) * SCOPES_PER_PAGE,
                                  (scopePages[lab.id] || 1) * SCOPES_PER_PAGE
                                )
                                .map((scope: any, i: number) => (
                                <tr key={i} className="border-b border-muted/50 hover:bg-muted/30">
                                  <td className="p-2 font-mono">{scope.standard_number || '-'}</td>
                                  <td className="p-2">{scope.product || '-'}</td>
                                  <td className="p-2 hidden sm:table-cell">{scope.grade_type_size || '-'}</td>
                                  <td className="p-2 hidden md:table-cell">{scope.testing_charges || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {expandedScopes[lab.id].length > SCOPES_PER_PAGE && (
                            <div className="flex items-center justify-between mt-4 px-2">
                              <p className="text-xs text-muted-foreground">
                                Showing {((scopePages[lab.id] || 1) - 1) * SCOPES_PER_PAGE + 1} to {Math.min((scopePages[lab.id] || 1) * SCOPES_PER_PAGE, expandedScopes[lab.id].length)} of {expandedScopes[lab.id].length} standards
                              </p>
                              
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setScopePages(prev => ({ ...prev, [lab.id]: Math.max((prev[lab.id] || 1) - 1, 1) }))}
                                  disabled={(scopePages[lab.id] || 1) === 1}
                                  className="p-1.5 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                
                                <span className="text-xs font-medium px-2">
                                  Page {scopePages[lab.id] || 1} of {Math.ceil(expandedScopes[lab.id].length / SCOPES_PER_PAGE)}
                                </span>
                                
                                <button
                                  onClick={() => setScopePages(prev => ({ ...prev, [lab.id]: Math.min((prev[lab.id] || 1) + 1, Math.ceil(expandedScopes[lab.id].length / SCOPES_PER_PAGE)) }))}
                                  disabled={(scopePages[lab.id] || 1) === Math.ceil(expandedScopes[lab.id].length / SCOPES_PER_PAGE)}
                                  className="p-1.5 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {lab.scope_url && (
                            <p className="text-xs text-center mt-3 pt-3 border-t">
                              <a href={lab.scope_url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                                View full scope on official BIS LIMS <ExternalLink size={10} />
                              </a>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
