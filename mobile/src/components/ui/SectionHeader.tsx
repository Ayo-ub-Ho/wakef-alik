/**
 * SectionHeader - Title with optional badge
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme/tokens';

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Emoji prefix (e.g., "🏪") */
  emoji?: string;
  /** Badge text (e.g., "3 New") */
  badge?: string;
  /** Action text (e.g., "See All") */
  actionText?: string;
  /** Action handler */
  onAction?: () => void;
}

export function SectionHeader({
  title,
  emoji,
  badge,
  actionText,
  onAction,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {emoji && <Text style={styles.emoji}>{emoji}</Text>}
        <Text style={styles.title}>{title}</Text>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>

      {actionText && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: typography.size.xl,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  badge: {
    backgroundColor: `${colors.primary}33`, // 20% opacity
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  actionText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.muted,
  },
});

export default SectionHeader;
