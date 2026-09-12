/**
 * NeuroNest Color Palette & Theme Configuration
 * Extracted from approved brand logo files and visual design reference.
 */

export const palette = {
  // Neutrals
  bg: "#FBF3EC", // Warm off-white canvas
  surface: "#FFFFFF", // Card surface, input background
  surfaceAlt: "#FCF6F0", // Alternating section surface
  text: "#332C26", // Deep espresso charcoal body text
  textMuted: "#6E6259", // Soft muted secondary text
  border: "#EBDFD3", // Warm hairline border

  // Coral (Primary Accent — CTAs, badges, brand highlights)
  coral: {
    tint: "#FBE3DA", // Light tint for icon badge backgrounds
    DEFAULT: "#E2775B", // Primary brand coral
    deep: "#C85F45", // Hover states, emphasized text
  },

  // Gold (Secondary Accent — Warmth, reassuring highlights, wordmark)
  gold: {
    tint: "#F5E6C6", // Warm gold tint
    DEFAULT: "#C4922E", // Warm golden ochre
    deep: "#A97B22", // Deep golden brown
  },

  // Sage (Secondary Accent — Clinical grounding, quote cards, footer)
  sage: {
    tint: "#E4EAE0", // Calming pale sage tint
    DEFAULT: "#6E8261", // Mid clinical sage
    deep: "#566A4B", // Deep forest sage for headers & high contrast
  },

  // Focus & Feedback
  focusRing: "#A64B32",
  onAccent: "#FFFFFF",
  success: "#2E7D32",
  error: "#C62828",
} as const;

export type Palette = typeof palette;
