import { describe, it, expect } from 'vitest';
import { coverageByMode } from './coverage';
import type { ChildProfile, TripContent } from '@/lib/contracts/types';

const profiles: ChildProfile[] = [
  {
    id: 'cp_1',
    name: 'Lenny',
    age: 6,
    mode: 'little',
    interests: [],
    dietary: [],
    medical: [],
    created_at: '2026-05-01T09:00:00Z',
    updated_at: '2026-05-01T09:00:00Z',
  },
  {
    id: 'cp_2',
    name: 'Mia',
    age: 9,
    mode: 'explorer_plus',
    interests: [],
    dietary: [],
    medical: [],
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
          slot: 'afternoon',
          title: 'Beach',
          activities: [
            {
              id: 'a_1',
              kind: 'kid',
              title: 'Treasure hunt',
              variants: { little: { body: 'simple' } },
            },
            { id: 'a_2', kind: 'kid', title: 'Rock pools' },
            { id: 'a_3', kind: 'adult', title: 'Sunset drinks' },
          ],
        },
      ],
    },
  ],
};

describe('coverageByMode', () => {
  it('reports coverage for each mode a child uses, over kid/shared activities only', () => {
    const coverage = coverageByMode(profiles, content);
    expect(coverage.map((c) => c.mode)).toEqual(['little', 'explorer_plus']);
    // Two kid activities (a_1, a_2); the adult one is excluded.
    expect(coverage[0].total).toBe(2);
  });

  it('flags activities missing a tailored variant for the mode', () => {
    const coverage = coverageByMode(profiles, content);
    const little = coverage.find((c) => c.mode === 'little')!;
    // a_1 has a little variant, a_2 does not.
    expect(little.covered).toBe(1);
    expect(little.missing.map((m) => m.id)).toEqual(['a_2']);

    const big = coverage.find((c) => c.mode === 'explorer_plus')!;
    // Neither activity has an explorer_plus variant.
    expect(big.missing.map((m) => m.id)).toEqual(['a_1', 'a_2']);
  });

  it('returns an empty matrix with no content', () => {
    expect(coverageByMode(profiles, null)).toEqual([]);
  });
});
