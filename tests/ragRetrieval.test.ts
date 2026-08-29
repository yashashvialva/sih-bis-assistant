import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateProvenance } from '@/lib/ai/provenance';
import { supabase } from '@/lib/db/supabaseClient';

vi.mock('@/lib/db/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Provenance Validation (Rule 11)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('assigns NO_MATCHING_SOURCE if no chunks provided', async () => {
    const result = await validateProvenance([], 'some text');
    expect(result.confidenceLevel).toBe('NO_MATCHING_SOURCE');
  });

  it('assigns AI_INTERPRETATION if any chunk is not authoritative', async () => {
    (supabase as any).from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            standard_number: 'IS 123',
            authoritative: true,
            source_type: 'official',
          },
          {
            id: '2',
            standard_number: 'IS 456',
            authoritative: false,
            source_type: 'demo',
          },
        ],
        error: null,
      }),
    });

    const result = await validateProvenance(['1', '2'], 'some text');
    expect(result.confidenceLevel).toBe('AI_INTERPRETATION');
  });

  it('assigns VERIFIED_BIS_DATA if all chunks are authoritative', async () => {
    (supabase as any).from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            standard_number: 'IS 123',
            authoritative: true,
            source_type: 'official',
          },
        ],
        error: null,
      }),
    });

    const result = await validateProvenance(['1'], 'some text');
    expect(result.confidenceLevel).toBe('VERIFIED_BIS_DATA');
  });
});
