/**
 * PreventOS design tokens — calm, non-clinical, distinctive (WP2.1).
 * Warm paper neutrals + terracotta actions; no clinical blue/white, no alarm red.
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

  // Primary — terracotta: warm, present, action-oriented
  primary: "#B65F45",
  primaryPressed: "#984E38",
  primarySoft: "#F5E2DA",
  onPrimary: "#FFFFFF",

  // Accent — peach/coral: companion chips and gentle highlights
  accent: "#D88963",
  accentSoft: "#F8E7DC",
  peach: "#F3B493",
  peachSoft: "#FBE9DF",

  // Success — sage: growth, steadiness
  success: "#5B7F62",
  successPressed: "#47664E",
  successSoft: "#E5EFE6",

  // Rescue — warm clay: present and findable, never alarm-red
  rescue: "#AA4F43",
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
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const type = {
  display: { fontFamily: "serif", fontSize: 34, lineHeight: 40, fontWeight: "700" },
  title: { fontFamily: "serif", fontSize: 25, lineHeight: 31, fontWeight: "700" },
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
