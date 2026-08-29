'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Server, CheckCircle2, XCircle } from 'lucide-react';
import type { TrustedSource } from '@/lib/ingestion/types';

export default function SourcesPage() {
  const [sources, setSources] = useState<TrustedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/sources')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setSources(data.sources || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-lg">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trusted Sources</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the authoritative domain allowlist.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Source
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <th className="px-6 py-4">Source Name</th>
                <th className="px-6 py-4">Domain</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {sources.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No sources configured. Run migration 002.
                  </td>
                </tr>
              )}
              {sources.map(source => (
                <tr key={source.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                    <Server size={16} className="text-gray-400" />
                    {source.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">{source.domain}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {source.sourceType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {source.enabled ? (
                      <span className="flex items-center gap-1.5 text-green-700 text-xs font-medium">
                        <CheckCircle2 size={14} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                        <XCircle size={14} /> Disabled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
