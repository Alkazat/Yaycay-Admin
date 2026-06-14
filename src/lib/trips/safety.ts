import type { ChildProfile, TripContent } from '@/lib/contracts/types';

/*
 * Trip-level safety roll-up. Aggregates every child's dietary + medical flags
 * and every activity safety note across the itinerary, then flags gaps:
 *  - an "unacknowledged" flag is a child safety flag that no activity note
 *    mentions anywhere on the trip, and
 *  - a "booking without safety" is a moment with a venue booking but no safety
 *    note, while the trip has at least one flagged child.
 * Neither is proof of a problem; both are prompts for a human to check, so a
 * mismatch (nut allergy + an unnoted restaurant) is caught before a family
 * hits it. Pure + React-free so it is unit-tested.
 */

export interface ProfileFlag {
  profile: string;
  flag: string;
  kind: 'dietary' | 'medical';
}

export interface BookingGap {
  activityId: string;
  title: string;
  booking: string;
}

export interface TripSafetySummary {
  flags: ProfileFlag[];
  unacknowledged: ProfileFlag[];
  bookingsWithoutSafety: BookingGap[];
  hasFlags: boolean;
  hasGaps: boolean;
}

/** Words that carry no allergen meaning, so they never count as an ack match. */
const STOPWORDS = new Set(['free', 'low', 'none', 'friendly', 'safe']);

function collectFlags(profiles: ChildProfile[]): ProfileFlag[] {
  const out: ProfileFlag[] = [];
  for (const profile of profiles) {
    for (const flag of profile.dietary ?? []) {
      out.push({ profile: profile.name, flag, kind: 'dietary' });
    }
    for (const flag of profile.medical ?? []) {
      out.push({ profile: profile.name, flag, kind: 'medical' });
    }
  }
  return out;
}

/** Lowercased text of every safety note + flag list across the itinerary. */
function safetyCorpus(content: TripContent): string {
  const parts: string[] = [];
  for (const day of content.days) {
    for (const moment of day.moments) {
      for (const activity of moment.activities) {
        if (activity.safety?.note) parts.push(activity.safety.note);
        if (activity.safety?.flags) parts.push(activity.safety.flags.join(' '));
      }
    }
  }
  return parts.join(' \n ').toLowerCase();
}

/** A flag is acknowledged if any meaningful token of it appears in the corpus. */
function isAcknowledged(flag: string, corpus: string): boolean {
  const tokens = flag
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
  return tokens.length > 0 && tokens.some((token) => corpus.includes(token));
}

export function tripSafetySummary(
  profiles: ChildProfile[],
  content: TripContent | null,
): TripSafetySummary {
  const flags = collectFlags(profiles);
  const corpus = content ? safetyCorpus(content) : '';
  const unacknowledged = flags.filter((f) => !isAcknowledged(f.flag, corpus));

  const bookingsWithoutSafety: BookingGap[] = [];
  if (content && flags.length > 0) {
    for (const day of content.days) {
      for (const moment of day.moments) {
        for (const activity of moment.activities) {
          if (activity.booking && !activity.safety?.note) {
            bookingsWithoutSafety.push({
              activityId: activity.id,
              title: activity.title,
              booking: activity.booking.name,
            });
          }
        }
      }
    }
  }

  return {
    flags,
    unacknowledged,
    bookingsWithoutSafety,
    hasFlags: flags.length > 0,
    hasGaps: unacknowledged.length > 0 || bookingsWithoutSafety.length > 0,
  };
}
