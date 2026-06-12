import type { ChildProfile, Variants } from '@/lib/contracts/types';

/*
 * Pure helpers for the trip inspector, free of React so they can be unit-tested.
 */

const MODE_ORDER = ['standard', 'little', 'explorer', 'explorer_plus'] as const;

/** Which per-mode variant blocks are present, in a stable display order. */
export function presentVariantModes(variants?: Variants): string[] {
  if (!variants) return [];
  return MODE_ORDER.filter((mode) => variants[mode] !== undefined);
}

export interface ProfileSafety {
  dietary: string[];
  medical: string[];
  hasAny: boolean;
}

/** Collects a profile's dietary + medical safety flags for surfacing to admins. */
export function profileSafety(profile: ChildProfile): ProfileSafety {
  const dietary = profile.dietary ?? [];
  const medical = profile.medical ?? [];
  return { dietary, medical, hasAny: dietary.length > 0 || medical.length > 0 };
}
