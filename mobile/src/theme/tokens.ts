/**
 * Global Design Tokens
 * Stitch-inspired theme system for Wakef Alik
 */

export const colors = {
  // Primary brand color (vibrant yellow)
  primary: '#f9f506',
  primaryDark: '#e0dc05',
  primaryLight: '#faf966',

  // Backgrounds
  bg: '#f8f8f5',
  bgDark: '#f0f0ed',
  card: '#ffffff',

  // Text
  text: '#1c1c0d',
  textSecondary: '#4a4a3a',
  muted: '#9e9d47',
  placeholder: '#a0a090',

  // Borders & Dividers
  border: 'rgba(0,0,0,0.08)',
  borderLight: 'rgba(0,0,0,0.04)',

  // Semantic colors
  danger: '#D32F2F',
  dangerLight: '#FFEBEE',
  success: '#388E3C',
  successLight: '#E8F5E9',
  warning: '#FFA000',
  warningLight: '#FFF8E1',
  info: '#1976D2',
  infoLight: '#E3F2FD',

  // Status colors
  statusPending: '#FFA000',
  statusProposed: '#1976D2',
  statusAccepted: '#7B1FA2',
  statusInDelivery: '#0097A7',
  statusDelivered: '#388E3C',
  statusCancelled: '#D32F2F',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',

  // White/Black
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const typography = {
  // Font sizes
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    title: 24,
  },
  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const shadows = {
  // Card shadow (iOS)
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3, // Android
  },
  // Elevated card
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  // Subtle shadow
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // Bottom tab bar shadow
  tabBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  // Button shadow
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
} as const;

export const layout = {
  screenPaddingHorizontal: 16,
  screenPaddingVertical: 16,
  cardPadding: 16,
  tabBarHeight: 80,
  headerHeight: 56,
  buttonHeight: 52,
  inputHeight: 48,
  avatarSize: 44,
  iconSize: 24,
} as const;

// Theme object for easy access
const theme = {
  colors,
  radius,
  spacing,
  typography,
  shadows,
  layout,
};

export default theme;
