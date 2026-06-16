'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/session';
import {
  createAffiliate,
  getAffiliate,
  listAffiliateRedemptions,
  sendAffiliateReport,
  setAffiliateStatus,
} from '@/lib/data';
import { monthPeriodFromKey, summarise } from '@/lib/affiliates/report';
import { recordAudit } from '@/lib/audit';
import type { AffiliateStatus } from '@/lib/contracts/types';

/*
 * Affiliate-program writes. Each re-checks admin + MFA and records an audit
 * entry, the same deliberate-and-logged pattern as the other admin writes.
 */

export async function createAffiliateAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const handle = String(formData.get('handle') ?? '').trim();
  const discountPercent = Number(formData.get('discountPercent') ?? 0);
  const commissionPercent = Number(formData.get('commissionPercent') ?? 0);
  if (!name || !email || !handle) return;

  const created = await createAffiliate({
    name,
    email,
    handle,
    discountPercent,
    commissionPercent,
  });
  if (!created) redirect('/affiliates?notice=backend');
  await recordAudit({
    actor: session.email,
    action: 'affiliate.create',
    target: created.code,
    details: `${created.name} (${created.discountPercent}% / ${created.commissionPercent}%)`,
  });
  revalidatePath('/affiliates');
  redirect(
    `/affiliates?notice=created&code=${encodeURIComponent(created.code)}`,
  );
}

export async function setStatusAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const code = String(formData.get('code') ?? '');
  const status = String(formData.get('status') ?? '') as AffiliateStatus;
  if (!code || (status !== 'active' && status !== 'paused')) return;

  const updated = await setAffiliateStatus(code, status);
  if (!updated) redirect(`/affiliates/${code}?notice=backend`);
  await recordAudit({
    actor: session.email,
    action: 'affiliate.status',
    target: code,
    details: status,
  });
  revalidatePath('/affiliates');
  revalidatePath(`/affiliates/${code}`);
  redirect(`/affiliates/${code}?notice=status`);
}

/**
 * Recompute the period report server-side (never trust a client-sent total) and
 * hand it to BE to render + send via the transactional sender.
 */
export async function sendReportAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const code = String(formData.get('code') ?? '');
  const monthKey = String(formData.get('month') ?? '');
  if (!code) return;

  const affiliate = await getAffiliate(code);
  if (!affiliate) return;

  const today = new Date().toISOString().slice(0, 10);
  const period = monthPeriodFromKey(monthKey, today);
  const redemptions = await listAffiliateRedemptions(code);
  const report = summarise(affiliate, redemptions, period);

  const result = await sendAffiliateReport(code, report, affiliate.email);
  if (!result.sent) redirect(`/affiliates/${code}?notice=backend`);
  await recordAudit({
    actor: session.email,
    action: 'affiliate.report-send',
    target: code,
    details: `${report.periodStart}..${report.periodEnd} -> ${affiliate.email} (owed $${report.commissionOwedUsd.toFixed(2)})`,
  });
  revalidatePath(`/affiliates/${code}`);
  redirect(`/affiliates/${code}?notice=sent`);
}
