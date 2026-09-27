/**
 * Xonbay Business color tokens.
 *
 * Keep these values aligned with xonbay.com/src/app/globals.css.
 * Change this file to retheme the mobile app without editing screens.
 * Dark colors are defined for future theme support; the current UI uses light.
 */
export const lightColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSoft: '#F5F5F5',
  ink: '#111827',
  textSecondary: '#374151',
  muted: '#6B7280',
  placeholder: '#94A3B8',
  primary: '#3B82F6',
  primaryMuted: '#EFF6FF',
  accent: '#DBEAFE',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  divider: '#EEF2F7',
  success: '#22C55E',
  successSoft: '#F0FDF4',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  error: '#EF4444',
  errorSoft: '#FEF2F2',
  white: '#FFFFFF',
} as const;

export const darkColors = {
  background: '#0A0A0A',
  surface: '#171717',
  surfaceSoft: '#222222',
  ink: '#F8FAFC',
  textSecondary: '#CBD5E1',
  muted: '#94A3B8',
  placeholder: '#94A3B8',
  primary: '#3B82F6',
  primaryMuted: '#1E3A8A',
  accent: '#DBEAFE',
  border: '#262626',
  borderStrong: '#475569',
  divider: '#1E293B',
  success: '#22C55E',
  successSoft: '#14532D',
  warning: '#FBBF24',
  warningSoft: '#78350F',
  error: '#F87171',
  errorSoft: '#7F1D1D',
  white: '#FFFFFF',
} as const;

// Swap this one reference when the app adds a supported theme selector.
export const colors = lightColors;

export const palette = colors;
