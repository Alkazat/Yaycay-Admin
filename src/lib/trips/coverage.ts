import type { ChildProfile, TripContent } from '@/lib/contracts/types';
import { personaLabel } from '@/lib/trips/personas';

/*
 * Persona coverage. For every explorer mode in use by a child on this trip,
 * which kid / shared activities lack a tailored variant block for that mode?
 * A missing variant is not broken - the renderer falls back to the base body -
 * but it means that child reads generic copy where a sibling on another mode
 * gets tailored copy. Surfacing it lets ops spot generation gaps before the
 * family does. Pure + React-free so it is unit-tested.
 */

const KID_KINDS = new Set(['kid', 'shared']);

export interface CoverageActivity {
  id: string;
  title: string;
  day: string;
}

export interface ModeCoverage {
  mode: string;
  label: string;
  total: number;
  covered: number;
  missing: CoverageActivity[];
}

interface VariantedActivity extends CoverageActivity {
  variants?: Record<string, unknown>;
}

function kidActivities(content: TripContent): VariantedActivity[] {
  const acts: VariantedActivity[] = [];
  for (const day of content.days) {
    for (const moment of day.moments) {
      for (const activity of moment.activities) {
        if (KID_KINDS.has(activity.kind)) {
          acts.push({
            id: activity.id,
            title: activity.title,
            day: day.label || day.date,
            variants: activity.variants as Record<string, unknown> | undefined,
          });
        }
      }
    }
  }
  return acts;
}

/** Distinct modes that children on this trip actually use, in profile order. */
function modesInUse(profiles: ChildProfile[]): string[] {
  const seen: string[] = [];
  for (const profile of profiles) {
    if (profile.mode && !seen.includes(profile.mode)) seen.push(profile.mode);
  }
  return seen;
}

export function coverageByMode(
  profiles: ChildProfile[],
  content: TripContent | null,
): ModeCoverage[] {
  if (!content) return [];
  const acts = kidActivities(content);
  return modesInUse(profiles).map((mode) => {
    const missing = acts
      .filter((a) => !a.variants || a.variants[mode] === undefined)
      .map(({ id, title, day }) => ({ id, title, day }));
    return {
      mode,
      label: personaLabel(mode) ?? mode,
      total: acts.length,
      covered: acts.length - missing.length,
      missing,
    };
  });
}
