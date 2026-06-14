import { describe, it, expect } from 'vitest';
import {
  inPeriod,
  monthPeriod,
  monthPeriodFromKey,
  renderReportEmail,
  summarise,
} from './report';
import type { Affiliate, AffiliateRedemption } from '@/lib/contracts/types';

const affiliate: Affiliate = {
  id: 'aff_1',
  name: 'Sunny Travels',
  email: 'sunny@example.com',
  handle: '@sunnytravels',
  code: 'SUNNY15',
  discountPercent: 15,
  commissionPercent: 20,
  landingSlug: 'sunnytravels',
  status: 'active',
  createdAt: '2026-05-01T00:00:00Z',
};

const redemptions: AffiliateRedemption[] = [
  {
    purchaseId: 'pur_1',
    ownerEmail: 'a@example.com',
    priceId: 'price_holiday_ai',
    grossUsd: 129,
    discountUsd: 19.35,
    netUsd: 109.65,
    createdAt: '2026-06-03T10:00:00Z',
  },
  {
    purchaseId: 'pur_2',
    ownerEmail: 'b@example.com',
    priceId: 'price_holiday_byo',
    grossUsd: 59,
    discountUsd: 8.85,
    netUsd: 50.15,
    createdAt: '2026-06-20T10:00:00Z',
  },
  {
    purchaseId: 'pur_3',
    ownerEmail: 'c@example.com',
    priceId: 'price_holiday_ai',
    grossUsd: 129,
    discountUsd: 19.35,
    netUsd: 109.65,
    createdAt: '2026-05-28T10:00:00Z',
  },
];

describe('monthPeriod', () => {
  it('returns the first of the month to the first of the next', () => {
    expect(monthPeriod('2026-06-14')).toEqual({
      start: '2026-06-01',
      end: '2026-07-01',
    });
  });

  it('rolls over the year in December', () => {
    expect(monthPeriod('2026-12-31')).toEqual({
      start: '2026-12-01',
      end: '2027-01-01',
    });
  });
});

describe('monthPeriodFromKey', () => {
  it('parses a YYYY-MM key', () => {
    expect(monthPeriodFromKey('2026-06', '2026-01-01').start).toBe(
      '2026-06-01',
    );
  });

  it('falls back to the reference date for a bad key', () => {
    expect(monthPeriodFromKey('nope', '2026-03-09').start).toBe('2026-03-01');
  });
});

describe('inPeriod', () => {
  it('includes the start and excludes the end', () => {
    const period = { start: '2026-06-01', end: '2026-07-01' };
    expect(inPeriod('2026-06-01T00:00:00Z', period)).toBe(true);
    expect(inPeriod('2026-07-01T00:00:00Z', period)).toBe(false);
  });
});

describe('summarise', () => {
  it('aggregates only the in-period redemptions and computes commission on net', () => {
    const report = summarise(affiliate, redemptions, monthPeriod('2026-06-15'));
    // Two June redemptions; the May one is excluded.
    expect(report.redemptions).toBe(2);
    expect(report.grossRevenueUsd).toBe(188);
    expect(report.discountGivenUsd).toBe(28.2);
    expect(report.netRevenueUsd).toBe(159.8);
    // 20% of 159.80 = 31.96
    expect(report.commissionOwedUsd).toBe(31.96);
  });
});

describe('renderReportEmail', () => {
  it('includes the influencer, code, totals and commission', () => {
    const report = summarise(affiliate, redemptions, monthPeriod('2026-06-15'));
    const body = renderReportEmail(report, affiliate);
    expect(body).toContain('Sunny Travels');
    expect(body).toContain('SUNNY15');
    expect(body).toContain('$31.96');
    expect(body).toContain('20% of net');
  });
});
