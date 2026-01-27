/**
 * Welcome Screen - Role Selection (Stitch Style)
 * Entry point for unauthenticated users
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} from '../../src/theme/tokens';

type Language = 'EN' | 'FR' | 'AR';

export default function WelcomeScreen() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<Language>('EN');

  const handleRoleSelect = (role: 'DRIVER' | 'RESTAURANT') => {
    router.push({
      pathname: '/(auth)/register',
      params: { role },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Text style={styles.logoEmoji}>🛵</Text>
          <Text style={styles.appName}>Wakef Alik</Text>
          <Text style={styles.tagline}>Fast & reliable delivery</Text>
        </View>

        {/* Role Selection */}
        <View style={styles.rolesSection}>
          <Text style={styles.sectionTitle}>Get Started</Text>
          <Text style={styles.sectionSubtitle}>Choose your account type</Text>

          {/* Driver Card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelect('DRIVER')}
            activeOpacity={0.8}
          >
            <View style={styles.roleIconContainer}>
              <Text style={styles.roleIcon}>🛵</Text>
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>I am a Delivery Driver</Text>
              <Text style={styles.roleDescription}>
                Accept orders and earn money delivering
              </Text>
            </View>
            <Text style={styles.roleArrow}>→</Text>
          </TouchableOpacity>

          {/* Restaurant Card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelect('RESTAURANT')}
            activeOpacity={0.8}
          >
            <View style={styles.roleIconContainer}>
              <Text style={styles.roleIcon}>🍽️</Text>
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>I am a Restaurant Owner</Text>
              <Text style={styles.roleDescription}>
                Request deliveries for your orders
              </Text>
            </View>
            <Text style={styles.roleArrow}>→</Text>
          </TouchableOpacity>

          {/* Login Link - moved closer to cards */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.loginButton}>
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Language Switch */}
        <View style={styles.languageSection}>
          <View style={styles.languageSwitch}>
            {(['EN', 'FR', 'AR'] as Language[]).map(lang => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langButton,
                  selectedLang === lang && styles.langButtonActive,
                ]}
                onPress={() => setSelectedLang(lang)}
              >
                <Text
                  style={[
                    styles.langButtonText,
                    selectedLang === lang && styles.langButtonTextActive,
                  ]}
                >
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoEmoji: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.size.lg,
    color: colors.muted,
  },
  rolesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.size.md,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  roleIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: colors.bgDark,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  roleIcon: {
    fontSize: 28,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  roleDescription: {
    fontSize: typography.size.sm,
    color: colors.muted,
  },
  roleArrow: {
    fontSize: typography.size.xxl,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
  loginSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    fontSize: typography.size.md,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  loginButton: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  loginButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  languageSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  languageSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.bgDark,
    borderRadius: radius.full,
    padding: spacing.xs,
  },
  langButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  langButtonActive: {
    backgroundColor: colors.card,
    ...shadows.subtle,
  },
  langButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.muted,
  },
  langButtonTextActive: {
    color: colors.text,
    fontWeight: typography.weight.semibold,
  },
});
