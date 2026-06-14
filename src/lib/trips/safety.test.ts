import { describe, it, expect } from 'vitest';
import { tripSafetySummary } from './safety';
import type { ChildProfile, TripContent } from '@/lib/contracts/types';

const profiles: ChildProfile[] = [
  {
    id: 'cp_1',
    name: 'Lenny',
    age: 6,
    type: 'child',
    pin_set: false,
    mode: 'explorer',
    interests: [],
    dietary: ['nut-free'],
    medical: ['anaphylaxis (EpiPen)'],
    created_at: '2026-05-01T09:00:00Z',
    updated_at: '2026-05-01T09:00:00Z',
  },
];

const content: TripContent = {
  trip: {
    id: 't_1',
    destination: 'Singapore',
    start_date: '2026-06-26',
    end_date: '2026-06-27',
    timezone: 'Asia/Singapore',
    currency: 'SGD',
  },
  days: [
    {
      id: 'd_1',
      date: '2026-06-26',
      label: 'Arrival',
      moments: [
        {
          id: 'm_1',
          slot: 'evening',
          title: 'Dinner',
          activities: [
            {
              id: 'a_noted',
              kind: 'adult',
              title: 'Beach club',
              booking: { name: 'Ola Beach Club' },
              safety: { note: 'Confirm kitchen on nuts.', flags: ['nuts'] },
            },
            {
              id: 'a_unnoted',
              kind: 'adult',
              title: 'Late supper',
              booking: { name: 'Hawker Centre' },
            },
          ],
        },
      ],
    },
  ],
};

describe('tripSafetySummary', () => {
  it('acknowledges a dietary flag mentioned in a note and flags a medical one that is not', () => {
    const summary = tripSafetySummary(profiles, content);
    expect(summary.hasFlags).toBe(true);
    // "nut-free" matches "nuts" in the corpus, so it is acknowledged.
    const unackFlags = summary.unacknowledged.map((u) => u.flag);
    expect(unackFlags).not.toContain('nut-free');
    // "anaphylaxis (EpiPen)" is not named anywhere, so it surfaces.
    expect(unackFlags).toContain('anaphylaxis (EpiPen)');
  });

  it('flags a booking with no safety note when the trip has flagged children', () => {
    const summary = tripSafetySummary(profiles, content);
    const gapIds = summary.bookingsWithoutSafety.map((b) => b.activityId);
    expect(gapIds).toEqual(['a_unnoted']);
    expect(summary.hasGaps).toBe(true);
  });

  it('reports no flags and no gaps when no child carries a flag', () => {
    const clean: ChildProfile[] = [
      { ...profiles[0], dietary: [], medical: [] },
    ];
    const summary = tripSafetySummary(clean, content);
    expect(summary.hasFlags).toBe(false);
    expect(summary.hasGaps).toBe(false);
    expect(summary.bookingsWithoutSafety).toEqual([]);
  });
});
