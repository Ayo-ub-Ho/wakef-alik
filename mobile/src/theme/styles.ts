/**
 * Global Style Helpers
 * Reusable style generators using theme tokens
 */
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, spacing, typography, shadows, layout } from './tokens';

/**
 * Card style with shadow
 */
export const cardStyle = (elevated = false): ViewStyle => ({
  backgroundColor: colors.card,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.border,
  ...(elevated ? shadows.cardElevated : shadows.card),
});

/**
 * Pill/badge style
 */
export const pillStyle = (
  bgColor = colors.primary,
  textColor = colors.text,
): { container: ViewStyle; text: TextStyle } => ({
  container: {
    backgroundColor: bgColor,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    color: textColor,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});

/**
 * Screen padding
 */
export const screenPadding: ViewStyle = {
  paddingHorizontal: layout.screenPaddingHorizontal,
  paddingVertical: layout.screenPaddingVertical,
};

/**
 * Center content
 */
export const center: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center',
};

/**
 * Row layout
 */
export const row: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
};

/**
 * Row with space between
 */
export const rowBetween: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
};

/**
 * Common text styles
 */
export const textStyles = StyleSheet.create({
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.text,
    lineHeight: typography.size.title * typography.lineHeight.tight,
  },
  subtitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  body: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.regular,
    color: colors.text,
    lineHeight: typography.size.md * typography.lineHeight.normal,
  },
  bodyMuted: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.regular,
    color: colors.muted,
  },
  small: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
    color: colors.textSecondary,
  },
  smallMuted: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
    color: colors.muted,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

/**
 * Button base styles
 */
export const buttonBase: ViewStyle = {
  height: layout.buttonHeight,
  borderRadius: radius.full,
  paddingHorizontal: spacing.xl,
  ...center,
  ...shadows.button,
};

/**
 * Primary button
 */
export const primaryButton: ViewStyle = {
  ...buttonBase,
  backgroundColor: colors.primary,
};

/**
 * Secondary button
 */
export const secondaryButton: ViewStyle = {
  ...buttonBase,
  backgroundColor: colors.bgDark,
  shadowOpacity: 0,
  elevation: 0,
};

/**
 * Input field style
 */
export const inputStyle: ViewStyle = {
  height: layout.inputHeight,
  backgroundColor: colors.card,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.lg,
};

/**
 * Avatar style generator
 */
export const avatarStyle = (size = layout.avatarSize): ViewStyle => ({
  width: size,
  height: size,
  borderRadius: size / 2,
  backgroundColor: colors.primary,
  ...center,
});

/**
 * Divider style
 */
export const divider: ViewStyle = {
  height: 1,
  backgroundColor: colors.border,
  marginVertical: spacing.lg,
};

/**
 * Status badge colors
 */
export const getStatusColor = (
  status: string,
): { bg: string; text: string } => {
  switch (status) {
    case 'PENDING':
      return { bg: colors.warningLight, text: colors.statusPending };
    case 'PROPOSED':
      return { bg: colors.infoLight, text: colors.statusProposed };
    case 'ACCEPTED':
      return { bg: '#F3E5F5', text: colors.statusAccepted };
    case 'IN_DELIVERY':
      return { bg: '#E0F7FA', text: colors.statusInDelivery };
    case 'DELIVERED':
      return { bg: colors.successLight, text: colors.statusDelivered };
    case 'CANCELLED':
      return { bg: colors.dangerLight, text: colors.statusCancelled };
    default:
      return { bg: colors.bgDark, text: colors.muted };
  }
};

/**
 * Export all for convenience
 */
export { colors, radius, spacing, typography, shadows, layout };
