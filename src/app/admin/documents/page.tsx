'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { SourceDocument } from '@/lib/ingestion/types';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
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
        <p className="text-sm text-gray-500 mt-1">Review discovered documents and approve them for RAG usage.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <th className="px-6 py-4">Document</th>
                <th className="px-6 py-4">Standard</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {documents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No documents found. Run an ingestion job first.
                  </td>
                </tr>
              )}
              {documents.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <FileText size={16} className="text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{doc.title || 'Untitled Document'}</p>
                        <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline break-all">
                          {doc.sourceDomain}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs">{doc.standardNumber || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {doc.verificationStatus === 'PENDING_REVIEW' && (
                      <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1 w-max">
                        <Clock size={12} /> Pending Review
                      </span>
                    )}
                    {doc.verificationStatus === 'AUTHORITATIVE' && (
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium flex items-center gap-1 w-max">
                        <CheckCircle size={12} /> Authoritative
                      </span>
                    )}
                    {doc.verificationStatus === 'REJECTED' && (
                      <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 w-max">
                        <XCircle size={12} /> Rejected
                      </span>
                    )}
                    {doc.verificationStatus === 'DEMO' && (
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium w-max">
                        Demo Data
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {doc.verificationStatus === 'PENDING_REVIEW' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerify(doc.id, 'VERIFY')}
                          className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleVerify(doc.id, 'REJECT')}
                          className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
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
