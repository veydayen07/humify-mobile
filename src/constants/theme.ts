import { Platform } from "react-native";

export const Palette = {
  // Brand colors (Stitch UI PRD)
  primary: "#0F766E", // Primary Teal
  primaryDark: "#115E59",
  primaryLight: "#14B8A6",
  primarySurface: "#F0FDFA",
  primaryBorder: "#99F6E4",

  // Neutrals
  ink: "#0F172A", // Dark Slate
  inkSecondary: "#334155",
  muted: "#64748B",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  surface: "#FFFFFF",
  background: "#F8FAFC",
  black: "#000000",
  white: "#FFFFFF",

  // Status colors with semantic pairings
  success: "#059669",
  successSurface: "#ECFDF5",
  successBorder: "#A7F3D0",
  successText: "#065F46",

  warning: "#D97706",
  warningSurface: "#FFFBEB",
  warningBorder: "#FDE68A",
  warningText: "#92400E",

  danger: "#DC2626",
  dangerSurface: "#FEF2F2",
  dangerBorder: "#FECACA",
  dangerText: "#991B1B",

  info: "#2563EB",
  infoSurface: "#EFF6FF",
  infoBorder: "#BFDBFE",
  infoText: "#1E40AF",
} as const;

export const Colors = {
  light: {
    primary: Palette.primary,
    primarySurface: Palette.primarySurface,
    text: Palette.ink,
    textSecondary: Palette.muted,
    background: Palette.background,
    surface: Palette.surface,
    border: Palette.border,
    backgroundElement: "#F1F5F9",
    backgroundSelected: "#E2E8F0",
    card: Palette.surface,
  },
  dark: {
    primary: Palette.primaryLight,
    primarySurface: "#042F2E",
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    background: "#0B0F19",
    surface: "#111827",
    border: "#1F2937",
    backgroundElement: "#1F2937",
    backgroundSelected: "#374151",
    card: "#111827",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  none: 0,
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 28,
  eight: 32,
  ten: 40,
  twelve: 48,
} as const;

export const Radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Typography = {
  h1: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 32,
    color: Palette.ink,
  },
  h2: {
    fontSize: 20,
    fontWeight: "700" as const,
    lineHeight: 28,
    color: Palette.ink,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
    color: Palette.ink,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
    color: Palette.ink,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: "500" as const,
    lineHeight: 22,
    color: Palette.ink,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: "600" as const,
    lineHeight: 22,
    color: Palette.ink,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 18,
    color: Palette.muted,
  },
  captionMedium: {
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 18,
    color: Palette.muted,
  },
  captionBold: {
    fontSize: 13,
    fontWeight: "600" as const,
    lineHeight: 18,
    color: Palette.inkSecondary,
  },
  tiny: {
    fontSize: 11,
    fontWeight: "500" as const,
    lineHeight: 14,
    color: Palette.muted,
  },
};

export const OfficeLocationConfig = {
  name: "Humify Head Office",
  address: "Jl Nakula 6",
  latitude: -6.2087634,
  longitude: 106.845599,
  radiusMeters: 100, // Maximum allowed distance
};

export const MaxContentWidth = 600;
