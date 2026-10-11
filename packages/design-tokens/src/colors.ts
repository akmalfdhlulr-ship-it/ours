export const neutralColors = {
  background: "#F8F9F7",
  surface: "#FFFFFF",
  textPrimary: "#202522",
  textSecondary: "#69746D",
  border: "#E6EAE5",
} as const;

export const brandColors = {
  primaryBlue: "#2563EB",
  primaryBlueDark: "#1D4ED8",
  softBlue: "#DBEAFE",
  romanticPink: "#F43F5E",
  softPink: "#FEE2E2",
  rose: "#E11D48",
  sage: "#D8E8DA",
  peach: "#F4E4DA",
  yellow: "#F59E0B",
  yellowWarm: "#F5C85B",
} as const;

export const functionalColors = {
  success: "#10B981",
  successBackground: "#E7F4EB",
  error: "#EF4444",
  errorBackground: "#FCEBEB",
  warning: "#F59E0B",
  warningBackground: "#FFF4DB",
  accentHeart: "#F43F5E",
} as const;

export const colors = {
  ...neutralColors,
  ...brandColors,
  ...functionalColors,
  neutral: neutralColors,
  brand: brandColors,
  functional: functionalColors,
} as const;

export type Colors = typeof colors;
