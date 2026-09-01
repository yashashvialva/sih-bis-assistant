'use client';

import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Database,
  Globe,
} from 'lucide-react';

interface DiscoveryJob {
  id: string;
  state: string;
  status: string;
  pages_discovered: number;
  labs_found: number;
  labs_inserted: number;
  labs_updated: number;
  scope_records_found: number;
  errors: number;
  started_at: string;
  completed_at: string | null;
}

interface StateStats {
  state: string;
  lab_count: number;
  last_scraped: string | null;
}

export default function AdminLabsPage() {
  const [jobs, setJobs] = useState<DiscoveryJob[]>([]);
  const [stateStats, setStateStats] = useState<StateStats[]>([]);
  const [totalLabs, setTotalLabs] = useState(0);
  const [totalScopes, setTotalScopes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshingState, setRefreshingState] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch jobs
      const jobsRes = await fetch('/api/admin/labs/jobs');
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.jobs || []);
      }

      // Fetch stats
      const statsRes = await fetch('/api/admin/labs/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStateStats(statsData.states || []);
        setTotalLabs(statsData.totalLabs || 0);
        setTotalScopes(statsData.totalScopes || 0);
      }
    } catch (err) {
      console.error('Failed to load admin labs data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshState = async (state: string) => {
    setRefreshingState(state);
    try {
      await fetch('/api/labs/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      // Reload data after a short delay
      setTimeout(loadData, 2000);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshingState(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle size={14} className="text-emerald-500" />;
      case 'FAILED': return <XCircle size={14} className="text-destructive" />;
      case 'RUNNING': return <Loader2 size={14} className="animate-spin text-blue-500" />;
      default: return <Clock size={14} className="text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">BIS LIMS Laboratory Discovery</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor and manage laboratory data sourced from the official BIS LIMS portal.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <FlaskConical size={14} />
            Total Laboratories
          </div>
          <div className="text-2xl font-bold">{totalLabs}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Database size={14} />
            Total Scope Records
          </div>
          <div className="text-2xl font-bold">{totalScopes}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Globe size={14} />
            States Discovered
          </div>
          <div className="text-2xl font-bold">{stateStats.length}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock size={14} />
            Jobs Run
          </div>
          <div className="text-2xl font-bold">{jobs.length}</div>
        </div>
      </div>

      {/* State Stats Table */}
      <div className="card">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <FlaskConical size={16} />
            Discovered States
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-semibold">State</th>
                <th className="text-left p-3 font-semibold">Labs</th>
                <th className="text-left p-3 font-semibold">Last Scraped</th>
                <th className="text-left p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">
                  <Loader2 size={16} className="animate-spin mx-auto mb-2" />
                  Loading...
                </td></tr>
              ) : stateStats.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No states discovered yet. Use the Labs page to discover laboratories.
                </td></tr>
              ) : (
                stateStats.map(stat => (
                  <tr key={stat.state} className="border-b hover:bg-muted/20">
                    <td className="p-3 font-medium">{stat.state}</td>
                    <td className="p-3">{stat.lab_count}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {stat.last_scraped ? new Date(stat.last_scraped).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => refreshState(stat.state)}
                        disabled={refreshingState === stat.state}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {refreshingState === stat.state ? (
                          <><Loader2 size={12} className="animate-spin" /> Refreshing...</>
                        ) : (
                          <><RefreshCw size={12} /> Refresh</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="card">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock size={16} />
            Recent Discovery Jobs
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-semibold">State</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Labs Found</th>
                <th className="text-left p-3 font-semibold">Inserted</th>
                <th className="text-left p-3 font-semibold">Updated</th>
                <th className="text-left p-3 font-semibold">Scopes</th>
                <th className="text-left p-3 font-semibold">Errors</th>
                <th className="text-left p-3 font-semibold">Started</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                  <Loader2 size={16} className="animate-spin mx-auto mb-2" />
                  Loading...
                </td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No discovery jobs yet.
                </td></tr>
              ) : (
                jobs.slice(0, 20).map(job => (
                  <tr key={job.id} className="border-b hover:bg-muted/20">
                    <td className="p-3 font-medium">{job.state}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1">
                        {getStatusIcon(job.status)}
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3">{job.labs_found}</td>
                    <td className="p-3">{job.labs_inserted}</td>
                    <td className="p-3">{job.labs_updated}</td>
                    <td className="p-3">{job.scope_records_found}</td>
                    <td className="p-3">{job.errors > 0 ? <span className="text-destructive">{job.errors}</span> : '0'}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {new Date(job.started_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
