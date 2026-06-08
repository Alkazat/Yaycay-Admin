import { describe, it, expect } from 'vitest';
import { dayOf, usageByTripDay, wouldExceedCap, DAILY_CAP } from './cap';
import type { AiJob } from '@/lib/contracts/types';

function job(tripId: string, createdAt: string): AiJob {
  return {
    id: `${tripId}-${createdAt}-${Math.random()}`,
    tripId,
    kind: 'ingestion',
    status: 'succeeded',
    model: 'claude-sonnet',
    promptVersion: 1,
    createdAt,
  };
}

describe('dayOf', () => {
  it('takes the calendar day from an ISO timestamp', () => {
    expect(dayOf('2026-06-08T11:02:00Z')).toBe('2026-06-08');
  });
});

describe('usageByTripDay', () => {
  it('counts jobs per trip per day and flags the cap', () => {
    const jobs = [
      job('t_1', '2026-06-08T01:00:00Z'),
      job('t_1', '2026-06-08T02:00:00Z'),
      job('t_1', '2026-06-07T02:00:00Z'),
      job('t_2', '2026-06-08T02:00:00Z'),
    ];
    const usage = usageByTripDay(jobs);
    const t1Today = usage.find(
      (u) => u.tripId === 't_1' && u.date === '2026-06-08',
    );
    expect(t1Today?.count).toBe(2);
    expect(t1Today?.remaining).toBe(DAILY_CAP - 2);
    expect(t1Today?.atCap).toBe(false);
  });

  it('marks atCap when the count reaches the cap', () => {
    const jobs = Array.from({ length: DAILY_CAP }, () =>
      job('t_1', '2026-06-08T01:00:00Z'),
    );
    const usage = usageByTripDay(jobs);
    expect(usage[0].atCap).toBe(true);
    expect(usage[0].remaining).toBe(0);
  });

  it('sorts newest day first', () => {
    const usage = usageByTripDay([
      job('t_1', '2026-06-06T01:00:00Z'),
      job('t_1', '2026-06-08T01:00:00Z'),
    ]);
    expect(usage.map((u) => u.date)).toEqual(['2026-06-08', '2026-06-06']);
  });
});

describe('wouldExceedCap', () => {
  it('is true once the day is at the cap', () => {
    const jobs = Array.from({ length: DAILY_CAP }, () =>
      job('t_1', '2026-06-08T01:00:00Z'),
    );
    expect(wouldExceedCap(jobs, 't_1', '2026-06-08')).toBe(true);
    expect(wouldExceedCap(jobs, 't_1', '2026-06-09')).toBe(false);
    expect(wouldExceedCap(jobs, 't_2', '2026-06-08')).toBe(false);
  });
});
