/*
 * Persona labels for explorer modes. The content model stores a child's mode
 * as a bare enum (little | explorer | explorer_plus | standard); these are the
 * family-facing names + emoji the product uses. Surfacing them in the admin
 * inspector means ops reads the same label a family sees, instead of a raw
 * enum. Pure + React-free so it is unit-tested.
 */

export type ExplorerMode = 'little' | 'explorer' | 'explorer_plus' | 'standard';

export interface Persona {
  mode: ExplorerMode;
  emoji: string;
  label: string;
}

const PERSONAS: Record<ExplorerMode, Persona> = {
  little: { mode: 'little', emoji: '🐣', label: 'Little Explorer' },
  explorer: { mode: 'explorer', emoji: '🧭', label: 'Explorer' },
  explorer_plus: { mode: 'explorer_plus', emoji: '🚀', label: 'Big Explorer' },
  standard: { mode: 'standard', emoji: '🛡️', label: 'Grown Ups' },
};

/** The persona for a mode, or null for an absent/unknown mode. */
export function personaFor(mode?: string | null): Persona | null {
  if (!mode) return null;
  return PERSONAS[mode as ExplorerMode] ?? null;
}

/**
 * Display label like "🚀 Big Explorer". Falls back to the raw mode string for
 * an unrecognised value (so a new BE mode still shows something), or null when
 * there is no mode at all.
 */
export function personaLabel(mode?: string | null): string | null {
  if (!mode) return null;
  const persona = personaFor(mode);
  return persona ? `${persona.emoji} ${persona.label}` : mode;
}
