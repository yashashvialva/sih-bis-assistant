'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Play, Activity, AlertTriangle } from 'lucide-react';
import type { IngestionJob } from '@/lib/ingestion/types';

export default function IngestionPage() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inputStandard, setInputStandard] = useState('');
  const [inputProduct, setInputProduct] = useState('');
  const [inputUrl, setInputUrl] = useState('');

  // Hackathon Demo State
  const [demoOldText, setDemoOldText] = useState('Clause 19.1: Heating appliances shall be subjected to an abnormal operation test. The thermal cut-out shall operate safely. The test duration is 30 minutes. The maximum allowable temperature is 95°C.');
  const [demoNewText, setDemoNewText] = useState('Clause 19.1: Heating appliances shall be subjected to an abnormal operation test. The thermal cut-out shall operate safely. The test duration is 60 minutes. A dual thermal protection system is mandatory. The maximum allowable temperature is 90°C.');
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoResult, setDemoResult] = useState<any>(null);

const DEMO_CATEGORIES = [
  'Domestic Electric Appliances',
  'Steel Products',
  'Textiles',
  'Electronics',
  'Electric Kettle',
  'Ceiling Fan',
  'LED Lamp',
  'Air Conditioner',
  'Microwave Oven'
];

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = () => {
    fetch('/api/admin/ingest')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setJobs(data.jobs || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleStartIngestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStarting(true);
    try {
      const payload = {
        standardNumber: inputStandard || undefined,
        productCategory: inputProduct || undefined,
        urls: inputUrl ? [inputUrl] : undefined,
      };
      
      const res = await fetch('/api/admin/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to start ingestion');
      }
      
      setInputStandard('');
      setInputProduct('');
      setInputUrl('');
      fetchJobs();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsStarting(false);
    }
  };

  const handleRunDemoDiff = async () => {
    setIsDemoRunning(true);
    setDemoResult(null);
    try {
      const res = await fetch('/api/alerts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          standardNumber: 'IS 302-2-15',
          title: 'Amendment No. 3 — Updated Thermal Cut-out Requirements',
          oldText: demoOldText,
          newText: demoNewText,
          categories: ['Domestic Electric Appliances']
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run LLM diff');
      setDemoResult(data);
    } catch (err: any) {
      alert(`Demo Error: ${err.message}`);
    } finally {
      setIsDemoRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Source Discovery</h1>
        <p className="text-sm text-gray-500 mt-1">Discover candidate documents for the Electrotechnical category. Human verification is required before ingestion.</p>
      </div>

      <div className="card p-6 border-t-4" style={{ borderTopColor: 'var(--color-primary-500)' }}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Play size={18} className="text-primary-600" /> Discover Sources
        </h2>
        <form onSubmit={handleStartIngestion} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Standard Number</label>
            <input 
              type="text" 
              className="input w-full" 
              placeholder="e.g., IS 302-2-15" 
              value={inputStandard}
              onChange={e => setInputStandard(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Category</label>
            <select
              className="input w-full"
              value={inputProduct}
              onChange={e => setInputProduct(e.target.value)}
            >
              <option value="">Select a category...</option>
              {DEMO_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Direct URL (Optional)</label>
            <input 
              type="text" 
              className="input w-full" 
              placeholder="e.g., https://law.resource.org/..." 
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <button 
              type="submit" 
              className="btn btn-primary w-full flex justify-center items-center gap-2"
              disabled={isStarting || (!inputStandard && !inputProduct && !inputUrl)}
            >
              {isStarting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Run Discovery
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-3">
          Note: This will discover sources across enabled registries (e.g. Electric Kettle, Ceiling Fan, LED Lamp). Discovered documents remain PENDING_REVIEW until verified.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Activity size={16} className="text-gray-500" />
          <h3 className="font-semibold text-gray-700 text-sm uppercase">Recent Jobs</h3>
        </div>
        
        {loading && jobs.length === 0 ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No jobs found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {jobs.map(job => (
              <div key={job.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-500">ID: {job.id.split('-')[0]}</span>
                      {job.status === 'RUNNING' && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full animate-pulse font-medium">Running</span>}
                      {job.status === 'COMPLETED' && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Completed</span>}
                      {job.status === 'FAILED' && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Failed</span>}
                    </div>
                    <div className="text-sm text-gray-600">
                      Started: {new Date(job.startedAt).toLocaleString()} 
                      {job.completedAt && ` • Completed: ${new Date(job.completedAt).toLocaleString()}`}
                    </div>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div className="bg-white p-2 rounded border border-gray-100 shadow-sm min-w-[70px]">
                      <div className="text-xl font-bold text-gray-800">{job.documentsCreated + job.documentsUpdated}</div>
                      <div className="text-[10px] uppercase text-gray-500 font-semibold mt-1">Docs</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-100 shadow-sm min-w-[70px]">
                      <div className="text-xl font-bold text-gray-800">{job.chunksCreated}</div>
                      <div className="text-[10px] uppercase text-gray-500 font-semibold mt-1">Chunks</div>
                    </div>
                    {job.errors > 0 && (
                      <div className="bg-red-50 p-2 rounded border border-red-100 min-w-[70px]">
                        <div className="text-xl font-bold text-red-700 flex justify-center items-center gap-1">
                          <AlertTriangle size={14} /> {job.errors}
                        </div>
                        <div className="text-[10px] uppercase text-red-600 font-semibold mt-1">Errors</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Last log entry preview */}
                {job.log && job.log.length > 0 && (
                  <div className="mt-4 bg-gray-900 text-gray-300 p-3 rounded-md font-mono text-xs overflow-x-auto">
                    <div className="text-gray-500 mb-1">Latest log output:</div>
                    {job.log.slice(-3).map((l: any, i: number) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-gray-500 shrink-0">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                        <span className={l.level === 'error' ? 'text-red-400' : l.level === 'warn' ? 'text-yellow-400' : 'text-blue-300'}>
                          {l.level.toUpperCase()}
                        </span>
                        <span>{l.message}</span>
                        {l.url && <span className="text-gray-400">{l.url}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HACKATHON DEMO PANEL */}
      <div className="card p-6 border-t-4 mt-8" style={{ borderTopColor: 'var(--color-interpretation-500)', background: 'var(--color-interpretation-50)' }}>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--color-interpretation-700)' }}>
          <AlertTriangle size={24} /> Hackathon Demo: Real-Data LLM Diffing
        </h2>
        <p className="text-sm text-gray-700 mb-6 max-w-3xl">
          Use this panel during your pitch to simulate the BIS releasing a new standard update. 
          The Groq LLM will instantly diff the texts below, extract compliance changes, and push an alert to your users.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Old Standard Text</label>
            <textarea
              className="w-full h-32 p-3 text-sm rounded border border-gray-300 bg-white"
              value={demoOldText}
              onChange={e => setDemoOldText(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-emerald-800 mb-2">New Standard Text (Updated)</label>
            <textarea
              className="w-full h-32 p-3 text-sm rounded border border-emerald-300 bg-emerald-50 focus:ring-emerald-500"
              value={demoNewText}
              onChange={e => setDemoNewText(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleRunDemoDiff}
          disabled={isDemoRunning}
          className="w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
          style={{ background: 'linear-gradient(135deg, var(--color-interpretation-600), var(--color-interpretation-700))' }}
        >
          {isDemoRunning ? (
            <><Loader2 className="animate-spin" /> Generating Diff via Groq LLM...</>
          ) : (
            <><Activity size={24} /> Run LLM Diff Engine</>
          )}
        </button>

        {demoResult && (
          <div className="mt-6 p-4 rounded bg-white border border-gray-200">
            <h3 className="font-bold text-emerald-600 mb-2">✅ Success! Alert Inserted into Database</h3>
            <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
              {JSON.stringify(demoResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

    </div>
  );
}
