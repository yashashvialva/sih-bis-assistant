'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, FileText, CheckCircle, XCircle, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { SourceDocument } from '@/lib/ingestion/types';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<(SourceDocument & { sourceType?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = () => {
    setLoading(true);
    fetch('/api/admin/documents')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setDocuments(data.documents || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleVerify = async (id: string, action: 'VERIFY' | 'REJECT') => {
    try {
      const res = await fetch(`/api/admin/documents/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Update failed');
      fetchDocuments(); // Refresh list
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading && documents.length === 0) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
        <p className="text-sm text-gray-500 mt-1">Review discovered documents and manually approve them to begin ingestion (fetching, chunking, embedding).</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <th className="px-6 py-4 min-w-[300px]">Candidate Document</th>
                <th className="px-6 py-4">Metadata</th>
                <th className="px-6 py-4">Status & Provenance</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {documents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No candidate documents found. Run a discovery job first.
                  </td>
                </tr>
              )}
              {documents.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <FileText size={16} className="text-gray-400 mt-1 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">
                          {doc.title && !doc.title.startsWith('Candidate Document') 
                            ? doc.title 
                            : <span className="italic text-gray-500">Unknown / Not yet extracted</span>}
                        </p>
                        <div className="text-xs text-gray-500 flex flex-col gap-1">
                          <span className="font-mono bg-gray-100 px-1 py-0.5 rounded w-max">{doc.sourceDomain}</span>
                          <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-all">
                            {doc.sourceUrl}
                          </a>
                        </div>
                        <div className="text-xs text-gray-400 pt-2">
                          Discovered: {new Date(doc.createdAt).toLocaleString()} via {doc.discoveredBy}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500 block uppercase">Standard No.</span>
                        <span className="font-mono text-sm">{doc.standardNumber || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block uppercase">Source Type</span>
                        <span className="text-sm">{doc.sourceType || 'Unknown'}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 align-top">
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500 block uppercase mb-1">Verification</span>
                        {doc.verificationStatus === 'PENDING_REVIEW' && (
                          <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1 w-max border border-yellow-200">
                            <Clock size={12} /> Pending Review
                          </span>
                        )}
                        {doc.verificationStatus === 'AUTHORITATIVE' && (
                          <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium flex items-center gap-1 w-max border border-green-200">
                            <CheckCircle size={12} /> Verified
                          </span>
                        )}
                        {doc.verificationStatus === 'REJECTED' && (
                          <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 w-max border border-red-200">
                            <XCircle size={12} /> Rejected
                          </span>
                        )}
                      </div>
                      
                      <div className="pt-1">
                        <span className="text-xs text-gray-500 block uppercase mb-1">Authoritative</span>
                        {doc.authoritative ? (
                          <span className="text-green-700 text-xs font-medium flex items-center gap-1">
                            <ShieldCheck size={14} /> YES
                          </span>
                        ) : (
                          <span className="text-red-700 text-xs font-medium flex items-center gap-1">
                            <ShieldAlert size={14} /> NO
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 align-top">
                    {doc.verificationStatus === 'PENDING_REVIEW' ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleVerify(doc.id, 'VERIFY')}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors shadow-sm"
                        >
                          Verify & Ingest
                        </button>
                        <button
                          onClick={() => handleVerify(doc.id, 'REJECT')}
                          className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 italic">No actions available</span>
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
