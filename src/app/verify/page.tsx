'use client';

import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Keyboard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  ExternalLink,
  Edit2,
  FileText
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

type VerifyStep = 'HOME' | 'CAPTURE' | 'EXTRACTING' | 'CONFIRM' | 'UNAVAILABLE_INFO' | 'ANALYZING' | 'RESULT';
type InputMethod = 'PHOTO' | 'UPLOAD' | 'MANUAL';

export default function VerifyPage() {
  const { t } = useTranslation();
  
  const [step, setStep] = useState<VerifyStep>('HOME');
  const [inputType, setInputType] = useState<InputMethod>('MANUAL');
  
  const [licenceNumber, setLicenceNumber] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [extractedRawText, setExtractedRawText] = useState<string | null>(null);
  
  const [pastedResult, setPastedResult] = useState('');
  const [officialSourceUrl, setOfficialSourceUrl] = useState('');

  const [officialResult, setOfficialResult] = useState<any>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('HOME');
    setLicenceNumber('');
    setConfidence(null);
    setExtractedRawText(null);
    setPastedResult('');
    setOfficialResult(null);
    setAiExplanation(null);
    setError(null);
  };

  // ─── 1. FILE & CAMERA HANDLING ──────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, method: InputMethod) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setInputType(method);
    setStep('EXTRACTING');
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/verify/extract', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract text');
      
      const { result } = data;
      
      if (result.licenceNumber) {
        setLicenceNumber(result.licenceNumber);
        setConfidence(result.confidence);
        setExtractedRawText(result.extractedText);
        setStep('CONFIRM');
      } else {
        setError("We couldn't clearly detect a BIS licence number from this image. Please try a clearer photo or enter manually.");
        setStep('HOME');
      }
    } catch (err: any) {
      setError(err.message);
      setStep('HOME');
    }
  };

  // ─── 2. MANUAL ENTRY ───────────────────────────────────────
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenceNumber.trim()) return;
    setInputType('MANUAL');
    moveToInteractiveVerification();
  };

  // ─── 3. MOVE TO INTERACTIVE STEP ───────────────────────────
  const moveToInteractiveVerification = () => {
    // Generate appropriate URL for the user to visit
    const isRNumber = licenceNumber.toUpperCase().startsWith('R-');
    const url = isRNumber 
      ? 'https://www.crsbis.in/BIS/crsreglist.do'
      : 'https://www.manakonline.in/MANAK/ApplicationLicenceRelatedrpt#StatusofLicences';
    setOfficialSourceUrl(url);
    
    // As requested, log the UNAVAILABLE status silently here or let the backend do it.
    // To keep it simple, we will proceed to the UI step.
    setStep('UNAVAILABLE_INFO');
  };

  // ─── 4. ANALYZE PASTED RESULT ──────────────────────────────
  const analyzePastedResult = async () => {
    if (!pastedResult.trim()) {
      setError('Please paste the result from the official BIS portal first.');
      return;
    }

    setStep('ANALYZING');
    setError(null);

    try {
      const res = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenceNumber,
          inputType,
          extractedText: extractedRawText,
          extractionConfidence: confidence,
          pastedResult
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze result');

      setOfficialResult(data.result);
      setAiExplanation(data.explanation);
      setStep('RESULT');
    } catch (err: any) {
      setError(err.message);
      setStep('UNAVAILABLE_INFO');
    }
  };


  // ─── RENDERERS ─────────────────────────────────────────────
  
  if (step === 'HOME') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in text-center">
        <h1 className="text-3xl font-bold mb-3 text-foreground">Verify BIS Authenticity</h1>
        <p className="text-muted-foreground mb-10">
          How would you like to verify a product's BIS licence?
        </p>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-sm font-medium">
            <AlertTriangle size={16} className="inline mr-2 -mt-0.5" />
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={(e) => handleFileChange(e, 'PHOTO')} />
          <button onClick={() => cameraInputRef.current?.click()} className="card p-8 flex flex-col items-center justify-center gap-4 hover:border-primary hover:shadow-md transition-all group">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera size={28} />
            </div>
            <div className="font-semibold text-lg">Take Photo</div>
            <p className="text-xs text-muted-foreground text-center px-4">Use your device camera to snap a photo of the product package or BIS mark.</p>
          </button>

          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => handleFileChange(e, 'UPLOAD')} />
          <button onClick={() => fileInputRef.current?.click()} className="card p-8 flex flex-col items-center justify-center gap-4 hover:border-primary hover:shadow-md transition-all group">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={28} />
            </div>
            <div className="font-semibold text-lg">Upload Photo</div>
            <p className="text-xs text-muted-foreground text-center px-4">Upload an existing image of a label containing a CM/L or R number.</p>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-background text-muted-foreground">Or</span></div>
        </div>

        <form onSubmit={handleManualSubmit} className="mt-8 flex gap-3 max-w-md mx-auto">
          <div className="relative flex-1">
            <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input type="text" required placeholder="Enter CM/L or R Number manually..." className="input w-full pl-10 bg-background" value={licenceNumber} onChange={e => setLicenceNumber(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary font-medium px-6 shadow-sm">Proceed</button>
        </form>
      </div>
    );
  }

  if (step === 'EXTRACTING' || step === 'ANALYZING') {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center animate-fade-in">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">
          {step === 'EXTRACTING' ? 'Scanning Image...' : 'Analyzing Official Result...'}
        </h2>
        <p className="text-muted-foreground">
          {step === 'EXTRACTING' 
            ? 'Running local OCR to detect BIS identifiers...' 
            : 'Using AI to parse and structure the official BIS data...'}
        </p>
      </div>
    );
  }

  if (step === 'CONFIRM') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-fade-in text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-6">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Identifier Detected</h2>
        <p className="text-muted-foreground mb-8">We found the following BIS Licence Number. You may edit it if it is incorrect.</p>
        
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2 text-left text-muted-foreground">
            Detected Number <span className="font-normal text-xs">(Confidence: {confidence ? (confidence * 100).toFixed(0) : 0}%)</span>
          </label>
          <div className="relative">
            <input type="text" className="input w-full text-lg font-bold tracking-widest text-center py-4 bg-background border-2 focus:border-primary" value={licenceNumber} onChange={e => setLicenceNumber(e.target.value)} />
            <Edit2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={resetState} className="btn bg-muted text-foreground flex-1 font-medium">Cancel</button>
          <button onClick={moveToInteractiveVerification} className="btn btn-primary flex-1 font-medium text-base shadow-sm">Confirm & Proceed</button>
        </div>
      </div>
    );
  }

  if (step === 'UNAVAILABLE_INFO') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <button onClick={resetState} className="text-sm font-medium text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1">
          &larr; Start over
        </button>

        <div className="card p-6 md:p-8 mb-6 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/40">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="text-blue-500" />
            Interactive Verification Required
          </h2>
          <p className="text-muted-foreground mb-6 text-sm md:text-base">
            The official BIS portal requires interactive human verification (CAPTCHA) to prevent automated abuse. 
            To verify this licence, please follow these steps:
          </p>

          <div className="bg-background/80 rounded-lg p-5 border mb-6 text-sm">
            <ol className="list-decimal pl-5 space-y-3">
              <li>Click the <strong>Verify on Official BIS</strong> button below to open the official portal.</li>
              <li>Navigate to the <strong>Search a Licence</strong> or <strong>Licence Status</strong> section.</li>
              <li>Enter the Licence Number <strong>{licenceNumber}</strong> and solve the CAPTCHA.</li>
              <li>Highlight and <strong>Copy</strong> the result text displayed by the government website.</li>
              <li>Return to this page and <strong>Paste</strong> the result below for AI analysis.</li>
            </ol>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-background p-4 rounded-lg border mb-6">
            <div className="flex-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Licence to Check</span>
              <div className="text-xl font-mono font-bold mt-1">{licenceNumber}</div>
            </div>
            <a 
              href={officialSourceUrl} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-primary whitespace-nowrap shadow-sm w-full md:w-auto"
            >
              Verify on Official BIS <ExternalLink size={16} className="ml-1" />
            </a>
          </div>

          <div className="mt-8 border-t border-blue-200 dark:border-blue-900 pt-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText size={18} />
              Paste Official BIS Result
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              After checking the official portal, copy the text results they provide and paste them here. Our AI will analyze the official data.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded text-sm font-medium">
                {error}
              </div>
            )}
            
            <textarea
              className="input w-full h-32 mb-4 bg-background resize-y"
              placeholder="Paste the raw text from the BIS portal here..."
              value={pastedResult}
              onChange={(e) => setPastedResult(e.target.value)}
            />
            <button 
              onClick={analyzePastedResult}
              className="btn btn-primary w-full shadow-sm"
              disabled={!pastedResult.trim()}
            >
              Analyze Official Result
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'RESULT') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <button onClick={resetState} className="text-sm font-medium text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1">
          &larr; Verify another product
        </button>

        {officialResult.status === 'VALID' ? (
          <div className="card p-8 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle size={32} className="text-emerald-500" />
              <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                OFFICIAL BIS RESULT: VALID
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-background/50 p-4 rounded-lg">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Licence Number</span>
                <span className="font-mono font-medium">{officialResult.licenceNumber}</span>
              </div>
              <div className="bg-background/50 p-4 rounded-lg">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Validity</span>
                <span className="font-medium">{officialResult.validityDate || 'N/A'}</span>
              </div>
              <div className="bg-background/50 p-4 rounded-lg sm:col-span-2">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Product</span>
                <span className="font-medium">{officialResult.productName || 'N/A'}</span>
              </div>
              <div className="bg-background/50 p-4 rounded-lg sm:col-span-2">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Manufacturer</span>
                <span className="font-medium">{officialResult.manufacturer || 'N/A'}</span>
              </div>
              <div className="bg-background/50 p-4 rounded-lg sm:col-span-2">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Applicable Standard</span>
                <span className="font-medium">{officialResult.standardNumber || 'N/A'}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-emerald-200/50 flex justify-between text-xs text-emerald-700/70 dark:text-emerald-400/50">
              <span>Source: Official BIS (User Provided)</span>
              <span>Checked: {new Date(officialResult.checkedAt).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="card p-8 border-destructive/20 bg-destructive/5 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <XCircle size={32} className="text-destructive" />
              <h2 className="text-2xl font-bold text-destructive">
                OFFICIAL BIS RESULT: {officialResult.status.replace('_', ' ')}
              </h2>
            </div>
            <div className="bg-background/50 p-4 rounded-lg">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Licence Number</span>
              <span className="font-mono font-medium">{officialResult.licenceNumber}</span>
            </div>
            <div className="mt-6 pt-4 border-t border-destructive/10 flex justify-between text-xs text-destructive/70">
              <span>Source: Official BIS (User Provided)</span>
              <span>Checked: {new Date(officialResult.checkedAt).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* AI EXPLANATION SECTION */}
        {aiExplanation && (
          <div className="card p-6 border-blue-100 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-900/30 mt-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Search size={64} />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                <Search size={14} />
              </div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI Explanation</h3>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed max-w-prose">
              {aiExplanation}
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
