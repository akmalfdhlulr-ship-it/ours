export const fontFamily = {
  sans: "Geist, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const typography = {
  fontFamily,
  fontSize,
  lineHeight,
} as const;

export type Typography = typeof typography;
