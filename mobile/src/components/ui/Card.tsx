/**
 * Card - Generic container with theme styling
 */
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing, shadows } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  /** Elevated shadow style */
  elevated?: boolean;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  /** No padding inside */
  noPadding?: boolean;
  /** Background color override */
  backgroundColor?: string;
}

export function Card({
  children,
  elevated = false,
  style,
  noPadding = false,
  backgroundColor = colors.card,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        { backgroundColor },
        noPadding && styles.noPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  elevated: {
    ...shadows.cardElevated,
  },
  noPadding: {
    padding: 0,
  },
});

export default Card;
