import { describe, it, expect } from 'vitest';
import { canApply, applyDecision, pendingFirst } from './state';
import type { ReviewItem } from '@/lib/contracts/types';

function item(tripId: string, status: ReviewItem['status']): ReviewItem {
  return {
    tripId,
    destination: 'Somewhere',
    status,
    generatedAt: '2026-06-08T00:00:00Z',
    reviewedAt: null,
    reviewedBy: null,
  };
}

describe('canApply', () => {
  it('only allows decisions on pending items', () => {
    expect(canApply('pending')).toBe(true);
    expect(canApply('approved')).toBe(false);
    expect(canApply('edited')).toBe(false);
  });
});

describe('applyDecision', () => {
  it('approves a pending item', () => {
    const out = applyDecision([item('t_1', 'pending')], 't_1', 'approve');
    expect(out[0].status).toBe('approved');
  });

  it('edits a pending item', () => {
    const out = applyDecision([item('t_1', 'pending')], 't_1', 'edit');
    expect(out[0].status).toBe('edited');
  });

  it('leaves other items and already-reviewed items untouched', () => {
    const items = [item('t_1', 'approved'), item('t_2', 'pending')];
    const out = applyDecision(items, 't_1', 'edit');
    expect(out.find((i) => i.tripId === 't_1')?.status).toBe('approved');
    expect(out.find((i) => i.tripId === 't_2')?.status).toBe('pending');
  });

  it('does not mutate the input', () => {
    const items = [item('t_1', 'pending')];
    applyDecision(items, 't_1', 'approve');
    expect(items[0].status).toBe('pending');
  });
});

describe('pendingFirst', () => {
  it('orders pending, then approved, then edited', () => {
    const out = pendingFirst([
      item('t_e', 'edited'),
      item('t_a', 'approved'),
      item('t_p', 'pending'),
    ]);
    expect(out.map((i) => i.tripId)).toEqual(['t_p', 't_a', 't_e']);
  });
});
