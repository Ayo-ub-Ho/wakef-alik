/**
 * AppTopBar - Dashboard header with avatar, greeting, and online toggle
 */
import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme/tokens';

interface AppTopBarProps {
  /** User's display name */
  name: string;
  /** Subtitle text (e.g., "Ready to deliver?") */
  subtitle?: string;
  /** Online status */
  online: boolean;
  /** Toggle handler */
  onToggleOnline: (value: boolean) => void;
  /** Avatar text (initials) */
  avatarText?: string;
  /** Show settings icon */
  onSettingsPress?: () => void;
}

export function AppTopBar({
  name,
  subtitle,
  online,
  onToggleOnline,
  avatarText,
}: AppTopBarProps) {
  // Get initials from name
  const initials =
    avatarText ||
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <View style={styles.container}>
      {/* Left: Avatar + Text */}
      <View style={styles.leftSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.greeting}>Hello, {name} 👋</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {/* Right: Online Toggle */}
      <View style={styles.rightSection}>
        <View style={styles.onlineContainer}>
          <Text
            style={[styles.onlineLabel, online && styles.onlineLabelActive]}
          >
            {online ? 'ONLINE' : 'OFFLINE'}
          </Text>
          <Switch
            value={online}
            onValueChange={onToggleOnline}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.border}
            style={styles.switch}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  textContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  greeting: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.muted,
    marginTop: 2,
  },
  rightSection: {
    marginLeft: spacing.md,
  },
  onlineContainer: {
    alignItems: 'center',
  },
  onlineLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.muted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  onlineLabelActive: {
    color: colors.text,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
});

export default AppTopBar;
