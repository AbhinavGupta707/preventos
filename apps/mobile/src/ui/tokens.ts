/**
 * PreventOS design tokens — calm, non-clinical, distinctive (WP2.1).
 * Warm paper neutrals + deep sage primary; no clinical blue/white, no alarm red.
 * The crisis palette is intentionally unlike everything else in the app
 * (deep night indigo, high contrast) so crisis flows are visually distinct.
 */
export const color = {
  // Neutrals — warm paper, not clinical white
  background: "#FAF7F2",
  surface: "#FFFFFF",
  surfaceSunken: "#F1ECE3",
  border: "#E5DED2",
  ink: "#2A2722",
  inkMuted: "#6E675D",
  inkFaint: "#9A9286",

  // Primary — deep sage: growth, steadiness
  primary: "#3E6B4F",
  primaryPressed: "#32563F",
  primarySoft: "#E4EFE7",
  onPrimary: "#FFFFFF",

  // Accent — warm amber: savings, milestones, celebration
  accent: "#C77F2B",
  accentSoft: "#F7EBD9",

  // Rescue — warm clay: present and findable, never alarm-red
  rescue: "#B85C49",
  rescueSoft: "#F6E6E1",
  onRescue: "#FFFFFF",

  // Night — "can't sleep" rescue mode (dark, dim, audio-first)
  nightBackground: "#12131A",
  nightSurface: "#1C1E28",
  nightInk: "#C9C4B8",
  nightInkMuted: "#807B70",
  nightAccent: "#A98548",

  // Crisis — deep indigo, deliberately unlike the rest of the app
  crisisBackground: "#222D4F",
  crisisSurface: "#2E3A5F",
  crisisInk: "#FFFFFF",
  crisisInkMuted: "#C2CAE3",
  crisisAction: "#FFD27D",
  onCrisisAction: "#272727",

  success: "#3E6B4F",
  danger: "#9C3D2E",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: "700" },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "700" },
  heading: { fontSize: 19, lineHeight: 25, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 23, fontWeight: "400" },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
} as const;

export const shadow = {
  card: {
    shadowColor: "#2A2722",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
