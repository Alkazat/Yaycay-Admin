import type {
  Affiliate,
  AffiliateRedemption,
  AffiliateReport,
} from '@/lib/contracts/types';

/*
 * Affiliate monthly report: aggregate an influencer's attributed redemptions
 * over a period into revenue + the commission we owe, then render the email
 * body we send them. Pure + React-free so it is unit-tested; the actual send is
 * a BE / Brevo concern (transactional sender), triggered from the Admin screen.
 */

/** A half-open date range [start, end) of ISO dates (YYYY-MM-DD). */
export interface Period {
  start: string;
  end: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** The calendar month (UTC) containing `ref`, as [first, nextFirst). */
export function monthPeriod(ref: string): Period {
  const date = new Date(ref);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

/** Parse "YYYY-MM" into that month's period; invalid input falls back to `ref`. */
export function monthPeriodFromKey(key: string, ref: string): Period {
  return /^\d{4}-\d{2}$/.test(key)
    ? monthPeriod(`${key}-15`)
    : monthPeriod(ref);
}

export function inPeriod(iso: string, period: Period): boolean {
  const day = iso.slice(0, 10);
  return day >= period.start && day < period.end;
}

/** Aggregate redemptions in the period into a report (revenue + commission). */
export function summarise(
  affiliate: Affiliate,
  redemptions: AffiliateRedemption[],
  period: Period,
): AffiliateReport {
  const inWindow = redemptions.filter((r) => inPeriod(r.createdAt, period));
  const grossRevenueUsd = round2(
    inWindow.reduce((sum, r) => sum + r.grossUsd, 0),
  );
  const discountGivenUsd = round2(
    inWindow.reduce((sum, r) => sum + r.discountUsd, 0),
  );
  const netRevenueUsd = round2(inWindow.reduce((sum, r) => sum + r.netUsd, 0));
  const commissionOwedUsd = round2(
    (netRevenueUsd * affiliate.commissionPercent) / 100,
  );
  return {
    affiliateCode: affiliate.code,
    influencer: affiliate.name,
    periodStart: period.start,
    periodEnd: period.end,
    redemptions: inWindow.length,
    grossRevenueUsd,
    discountGivenUsd,
    netRevenueUsd,
    commissionOwedUsd,
    currency: 'USD',
  };
}

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** The plain-text / markdown email body sent to the influencer for a period. */
export function renderReportEmail(
  report: AffiliateReport,
  affiliate: Affiliate,
): string {
  return [
    `Hi ${report.influencer},`,
    '',
    `Here is your Yaycay affiliate summary for ${report.periodStart} to ${report.periodEnd}.`,
    '',
    `Code: ${report.affiliateCode} (${affiliate.discountPercent}% off for your audience)`,
    `Redemptions: ${report.redemptions}`,
    `Gross sales: ${money(report.grossRevenueUsd)}`,
    `Discount passed to customers: ${money(report.discountGivenUsd)}`,
    `Net sales: ${money(report.netRevenueUsd)}`,
    `Your commission (${affiliate.commissionPercent}% of net): ${money(report.commissionOwedUsd)}`,
    '',
    'Thank you for helping families make memories.',
    'Yaycay',
  ].join('\n');
}
