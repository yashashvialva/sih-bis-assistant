'use client';

import { AlertTriangle } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   <PersistentSafetyFooter />
   
   Permanent non-dismissible safety notice required on every
   document review screen. This component must NOT be hidden
   behind a tooltip, modal, or expandable section.
   ═══════════════════════════════════════════════════════════════ */

interface PersistentSafetyFooterProps {
  /** Optional additional context message */
  additionalMessage?: string;
  className?: string;
}

export function PersistentSafetyFooter({
  additionalMessage,
  className = '',
}: PersistentSafetyFooterProps) {
  return (
    <div
      className={`safety-footer ${className}`}
      role="alert"
      aria-live="polite"
      data-testid="safety-footer"
    >
      <AlertTriangle
        size={16}
        className="flex-shrink-0"
        style={{ color: 'var(--color-safety-border)' }}
      />
      <div>
        <p className="font-medium">
          AI-assisted document review. Final compliance certification is
          determined only by BIS-recognized certifying bodies.
        </p>
        {additionalMessage && (
          <p className="mt-1 opacity-80">{additionalMessage}</p>
        )}
      </div>
    </div>
  );
}
