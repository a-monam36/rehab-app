/**
 * MacroZone premium dark-mode design tokens.
 * Shared by every screen so the look stays consistent.
 */
export const colors = {
  background: '#0A0B0F',
  surface: '#14161D',
  surfaceElevated: '#1C1F29',
  border: '#262A36',
  borderStrong: '#343949',

  textPrimary: '#F4F5F8',
  textSecondary: '#A2A8B8',
  textMuted: '#6B7183',

  accent: '#7CFFB2', // MacroZone mint
  accentDim: 'rgba(124, 255, 178, 0.12)',
  accentOn: '#05140C',

  strength: '#7CFFB2',
  mobility: '#6CB8FF',
  mobilityDim: 'rgba(108, 184, 255, 0.12)',

  rehab: '#FF8A5B',
  rehabDim: 'rgba(255, 138, 91, 0.12)',

  danger: '#FF5C7A',
  dangerDim: 'rgba(255, 92, 122, 0.12)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.6 },
  title: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
  subtitle: { fontSize: 15, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.3 },
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;

