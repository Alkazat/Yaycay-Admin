import { describe, it, expect } from 'vitest';
import { canApply, applyDecision, pendingFirst } from './state';
import type { ReviewItem } from '@/lib/contracts/types';

function item(tripId: string, status: ReviewItem['status']): ReviewItem {
  return {
    tripId,
    destination: 'Somewhere',
    status,
    promptVersion: 1,
    generatedAt: '2026-06-08T00:00:00Z',
    summary: '...',
  };
}

describe('canApply', () => {
  it('allows approve from pending and publish from approved only', () => {
    expect(canApply('pending', 'approve')).toBe(true);
    expect(canApply('pending', 'publish')).toBe(false);
    expect(canApply('approved', 'publish')).toBe(true);
    expect(canApply('approved', 'approve')).toBe(false);
    expect(canApply('published', 'publish')).toBe(false);
  });
});

describe('applyDecision', () => {
  it('advances the matching item and leaves others untouched', () => {
    const items = [item('t_1', 'pending'), item('t_2', 'pending')];
    const out = applyDecision(items, 't_1', 'approve');
    expect(out.find((i) => i.tripId === 't_1')?.status).toBe('approved');
    expect(out.find((i) => i.tripId === 't_2')?.status).toBe('pending');
  });

  it('is a no-op for an invalid transition', () => {
    const items = [item('t_1', 'pending')];
    expect(applyDecision(items, 't_1', 'publish')).toEqual(items);
  });

  it('does not mutate the input', () => {
    const items = [item('t_1', 'pending')];
    applyDecision(items, 't_1', 'approve');
    expect(items[0].status).toBe('pending');
  });
});

describe('pendingFirst', () => {
  it('orders pending, then approved, then published', () => {
    const out = pendingFirst([
      item('t_pub', 'published'),
      item('t_app', 'approved'),
      item('t_pen', 'pending'),
    ]);
    expect(out.map((i) => i.tripId)).toEqual(['t_pen', 't_app', 't_pub']);
  });
});
