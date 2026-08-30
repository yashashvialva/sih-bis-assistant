'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical,
  MapPin,
  Search,
  CheckCircle,
  Map,
  Compass,
  AlertTriangle,
  Beaker,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

// We fetch labs from the backend API instead of static mock data
export default function LabsPage() {
  const { t } = useTranslation();
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchMode, setSearchMode] = useState<'nearby' | 'manual'>('nearby');
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);

  // Hardcoded for UI since we want user to filter, could also be fetched from API unique values
  const states = useMemo(() => [
    'Karnataka', 'Delhi', 'Gujarat', 'Maharashtra', 'Tamil Nadu', 'Telangana'
  ].sort(), []);

  const categories = useMemo(() => [
    'Private', 'Govt', 'In-house'
  ].sort(), []);

  // 1. Initial Load: Try to get Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          fetchLabs(latitude, longitude);
        },
        (err) => {
          console.warn("Geolocation permission denied or unavailable:", err);
          setSearchMode('manual');
          fetchLabs(); // fetch fallback without location
        }
      );
    } else {
      setSearchMode('manual');
      fetchLabs();
    }
  }, []);

  // 2. Fetch API
  const fetchLabs = async (lat?: number, lon?: number, state?: string, type?: string) => {
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        radiusKm: 50
      };
      
      if (lat && lon) {
        payload.latitude = lat;
        payload.longitude = lon;
      } else {
        if (state) payload.state = state;
        if (type) payload.laboratoryType = type;
      }
      
      if (type) payload.laboratoryType = type;

      const res = await fetch('/api/labs/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to fetch labs');
      
      const data = await res.json();
      setLabs(data.labs || []);


    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Effect to trigger manual search when dropdowns change (if not in nearby mode)
  useEffect(() => {
    if (searchMode === 'manual' && !loading) {
      fetchLabs(undefined, undefined, locationFilter, categoryFilter);
    }
  }, [locationFilter, categoryFilter, searchMode]);

  const triggerNearbySearch = () => {
    if (userLocation) {
      setSearchMode('nearby');
      fetchLabs(userLocation.lat, userLocation.lon, undefined, categoryFilter);
    } else {
      // Re-request location
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          setSearchMode('nearby');
          fetchLabs(latitude, longitude, undefined, categoryFilter);
        },
        (err) => {
          setSearchMode('manual');
          setLoading(false);
          setError("Location access denied. Please use the State filter.");
        }
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          {t('labs.title')}
        </h1>
        <p className="text-muted-foreground mb-4">Discover verified and accredited BIS testing laboratories near you.</p>
        
        {/* Real Data Notice */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle size={14} />
          Genuine Authoritative Source Data (BIS LIMS)
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-xl p-4 mb-6 shadow-sm">
        <div className="grid sm:grid-cols-[1fr,1fr,auto] gap-4 items-end">
          
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
              <MapPin size={14} className="inline mr-1" />
              State / Region
            </label>
            <select
              className="input w-full bg-background"
              value={locationFilter}
              onChange={e => {
                setLocationFilter(e.target.value);
                setSearchMode('manual');
              }}
            >
              <option value="">{searchMode === 'nearby' ? 'Current Location (Nearby)' : 'All States'}</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
              <Beaker size={14} className="inline mr-1" />
              Laboratory Type
            </label>
            <select
              className="input w-full bg-background"
              value={categoryFilter}
              onChange={e => {
                setCategoryFilter(e.target.value);
                if (searchMode === 'nearby' && userLocation) {
                  fetchLabs(userLocation.lat, userLocation.lon, undefined, e.target.value);
                }
              }}
            >
              <option value="">All Types</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={triggerNearbySearch}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 border h-10
                ${searchMode === 'nearby' 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background hover:bg-muted text-foreground'}`}
            >
              <Compass size={16} />
              Use My Location
            </button>
            {searchMode === 'nearby' && userLocation && (
              <span className="text-[10px] text-muted-foreground text-center">
                Lat: {userLocation.lat.toFixed(4)}, Lon: {userLocation.lon.toFixed(4)}
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Lab Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Locating verified laboratories...</p>
          </div>
        ) : error && searchMode === 'nearby' ? (
           <div className="card p-8 text-center bg-destructive/10 border-destructive/20">
             <AlertTriangle size={32} className="mx-auto mb-3 text-destructive" />
             <p className="text-destructive font-medium">{error}</p>
             <p className="text-sm mt-2 text-muted-foreground">Use the State dropdown to search the directory manually.</p>
           </div>
        ) : labs.length === 0 ? (
          <div className="card p-8 text-center bg-muted/30">
            <Map size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">
              {searchMode === 'nearby' 
                ? 'No verified laboratories found within 50km of your location.'
                : 'No laboratories match your current filters.'}
            </p>
            {searchMode === 'nearby' && (
              <button 
                onClick={() => setSearchMode('manual')}
                className="mt-4 text-primary hover:underline text-sm font-medium"
              >
                Search by State instead &rarr;
              </button>
            )}
          </div>
        ) : (
          labs.map(lab => (
            <div key={lab.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <FlaskConical size={20} />
                </div>
                <div className="flex-1">
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-lg text-foreground">
                      {lab.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {lab.verification_status && (
                        <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle size={10} />
                          {lab.verification_status.replace('_', ' ')}
                        </span>
                      )}
                      {lab.distance_km !== undefined && (
                        <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {lab.distance_km.toFixed(1)} km away
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm flex items-start gap-1.5 mb-3 text-muted-foreground max-w-2xl">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                    {lab.address}, {lab.city}, {lab.state} - {lab.pincode}
                  </p>

                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-4">
                    {lab.accreditation_number && (
                      <div className="bg-muted px-2.5 py-1 rounded-md border">
                        <span className="font-medium text-foreground">Accreditation: </span> 
                        {lab.accreditation_number}
                      </div>
                    )}
                    {lab.laboratory_type && (
                      <div className="bg-muted px-2.5 py-1 rounded-md border">
                        <span className="font-medium text-foreground">Type: </span> 
                        {lab.laboratory_type}
                      </div>
                    )}
                  </div>

                  {lab.source_url && (
                    <div className="mt-4 pt-3 border-t flex flex-wrap items-center gap-4">
                      <a 
                        href={lab.source_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        Verify on {lab.source_type} Portal &rarr;
                      </a>
                      
                      <a 
                        href={
                          lab.latitude && lab.longitude 
                            ? `https://www.google.com/maps/dir/?api=1&destination=${lab.latitude},${lab.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lab.name + ' ' + lab.address + ' ' + lab.city)}`
                        }
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium ml-auto"
                      >
                        <Map size={12} />
                        Get Directions
                      </a>
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
