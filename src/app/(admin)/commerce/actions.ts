'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { createProduct, setProductActive } from '@/lib/data';
import { recordAudit } from '@/lib/audit';
import type { CreateProductRequest } from '@/lib/contracts/types';

const KINDS = ['tier', 'keep'] as const;
const TIERS = ['ours', 'byo'] as const;

/**
 * Create a catalogue product (POST /admin/products). BE stamps the deploy's
 * Stripe mode, so a prod admin can only ever add live products. Audited.
 */
export async function createProductAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const priceId = String(formData.get('priceId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const amountRaw = String(formData.get('amountUsd') ?? '').trim();
  const kindRaw = String(formData.get('kind') ?? '');
  const tierRaw = String(formData.get('tier') ?? '');
  const extendsRaw = String(formData.get('extendsMonths') ?? '').trim();

  const amountUsd = Number.parseFloat(amountRaw);
  if (!priceId || !name || !Number.isFinite(amountUsd)) return;

  const kind = (KINDS as readonly string[]).includes(kindRaw)
    ? (kindRaw as CreateProductRequest['kind'])
    : 'tier';

  const input: CreateProductRequest = { priceId, name, amountUsd, kind };
  if (kind === 'tier' && (TIERS as readonly string[]).includes(tierRaw)) {
    input.tier = tierRaw as CreateProductRequest['tier'];
  }
  if (kind === 'keep' && extendsRaw) {
    const months = Number.parseInt(extendsRaw, 10);
    if (Number.isFinite(months) && months > 0) input.extendsMonths = months;
  }

  const created = await createProduct(input);
  if (created) {
    await recordAudit({
      actor: session.email,
      action: 'product.create',
      target: priceId,
      details: name,
    });
    revalidatePath('/commerce');
  }
}

/** Activate/deactivate a product (PATCH /admin/products/{priceId}). Audited. */
export async function setProductActiveAction(
  formData: FormData,
): Promise<void> {
  const session = await requireAdmin();
  const priceId = String(formData.get('priceId') ?? '').trim();
  const active = String(formData.get('active') ?? '') === 'true';
  if (!priceId) return;

  const updated = await setProductActive(priceId, active);
  if (updated) {
    await recordAudit({
      actor: session.email,
      action: active ? 'product.activate' : 'product.deactivate',
      target: priceId,
    });
    revalidatePath('/commerce');
  }
}
