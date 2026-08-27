/**
 * Trust Constraint Tests
 *
 * Verifies the core architectural requirement:
 * Every AI-generated claim MUST be categorized as
 * VERIFIED_BIS_DATA, AI_INTERPRETATION, or NO_MATCHING_SOURCE.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SourcedClaim, ConfidenceTag } from '@/components/trust/SourcedClaim';
import { PersistentSafetyFooter } from '@/components/trust/PersistentSafetyFooter';

describe('SourcedClaim Component — Trust Layer', () => {
  it('renders VERIFIED_BIS_DATA with standard number, clause, and evidence', () => {
    render(
      <SourcedClaim
        content="Test requirement for marking"
        confidenceLevel="VERIFIED_BIS_DATA"
        sources={[
          {
            standardNumber: 'IS 302-2-15',
            clause: 'Clause 7.1',
            sectionTitle: 'Marking',
            evidenceText: 'Appliances shall be marked...',
          },
        ]}
      />
    );

    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveTextContent('Verified against BIS data');

    const claim = screen.getByTestId('sourced-claim');
    expect(claim).toHaveAttribute('data-confidence', 'VERIFIED_BIS_DATA');
    expect(screen.getByTestId('claim-content')).toHaveTextContent(
      'Test requirement for marking'
    );

    // Expand to see sources
    const toggle = screen.getByTestId('expand-toggle');
    fireEvent.click(toggle);

    const sourceRef = screen.getByTestId('source-reference');
    expect(sourceRef).toHaveTextContent('IS 302-2-15');
    expect(sourceRef).toHaveTextContent('Clause 7.1');
    expect(sourceRef).toHaveTextContent('Appliances shall be marked...');
  });

  it('renders AI_INTERPRETATION with non-binding disclaimer', () => {
    render(
      <SourcedClaim
        content="This is an AI-generated explanation"
        confidenceLevel="AI_INTERPRETATION"
        reasoning="Based on related clause analysis"
        sources={[
          {
            standardNumber: 'IS 302-2-15',
            clause: 'Clause 19',
          },
        ]}
      />
    );

    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveTextContent('AI Interpretation');
    expect(badge).toHaveTextContent('Non-binding guidance');

    const claim = screen.getByTestId('sourced-claim');
    expect(claim).toHaveAttribute('data-confidence', 'AI_INTERPRETATION');
  });

  it('renders NO_MATCHING_SOURCE with explicit uncertainty', () => {
    render(
      <SourcedClaim
        content="No matching information found"
        confidenceLevel="NO_MATCHING_SOURCE"
        sources={[]}
      />
    );

    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveTextContent('No Authoritative Source Found');

    const claim = screen.getByTestId('sourced-claim');
    expect(claim).toHaveAttribute('data-confidence', 'NO_MATCHING_SOURCE');
  });

  it('never uses language implying compliance certification', () => {
    const { container } = render(
      <SourcedClaim
        content="The requirement has been checked"
        confidenceLevel="VERIFIED_BIS_DATA"
        sources={[
          { standardNumber: 'IS 302-2-15', clause: 'Clause 7.1' },
        ]}
      />
    );

    const text = container.textContent ?? '';
    expect(text).not.toContain('You are compliant');
    expect(text).not.toContain('You are non-compliant');
    expect(text).not.toContain('certified');
  });
});

describe('ConfidenceTag — Inline Badge', () => {
  it('renders correct badge for each level', () => {
    const { rerender } = render(
      <ConfidenceTag level="VERIFIED_BIS_DATA" />
    );
    expect(screen.getByTestId('confidence-tag')).toHaveTextContent(
      'Verified against BIS data'
    );

    rerender(<ConfidenceTag level="AI_INTERPRETATION" />);
    expect(screen.getByTestId('confidence-tag')).toHaveTextContent(
      'AI Interpretation'
    );

    rerender(<ConfidenceTag level="NO_MATCHING_SOURCE" />);
    expect(screen.getByTestId('confidence-tag')).toHaveTextContent(
      'No Authoritative Source Found'
    );
  });
});

describe('PersistentSafetyFooter', () => {
  it('renders the required safety message', () => {
    render(<PersistentSafetyFooter />);

    const footer = screen.getByTestId('safety-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent(
      'AI-assisted document review. Final compliance certification is determined only by BIS-recognized certifying bodies.'
    );
  });

  it('is always visible (not hidden/collapsed)', () => {
    render(<PersistentSafetyFooter />);
    const footer = screen.getByTestId('safety-footer');
    expect(footer).toBeVisible();
  });
});
