/**
 * SecondaryButton - Subtle button variant
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  colors,
  typography,
  spacing,
  radius,
  layout,
} from '../../theme/tokens';

interface SecondaryButtonProps {
  /** Button label */
  title: string;
  /** Press handler */
  onPress: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Smaller variant */
  small?: boolean;
  /** Icon before text (emoji or text) */
  icon?: string;
  /** Danger variant (red) */
  danger?: boolean;
}

export function SecondaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  small = false,
  icon,
  danger = false,
}: SecondaryButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        small && styles.buttonSmall,
        danger && styles.buttonDanger,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={danger ? colors.danger : colors.textSecondary}
        />
      ) : (
        <>
          {icon && (
            <Text style={[styles.icon, danger && styles.iconDanger]}>
              {icon}
            </Text>
          )}
          <Text
            style={[
              styles.text,
              small && styles.textSmall,
              danger && styles.textDanger,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: layout.buttonHeight,
    backgroundColor: colors.bgDark,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    height: 40,
    paddingHorizontal: spacing.lg,
  },
  buttonDanger: {
    backgroundColor: colors.dangerLight,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  textSmall: {
    fontSize: typography.size.md,
  },
  textDanger: {
    color: colors.danger,
  },
  icon: {
    fontSize: typography.size.lg,
    marginRight: spacing.sm,
  },
  iconDanger: {
    color: colors.danger,
  },
});

export default SecondaryButton;
