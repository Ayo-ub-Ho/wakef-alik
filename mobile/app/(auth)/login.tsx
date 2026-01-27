/**
 * Login Screen - Stitch Style
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, Link, Href } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { AppScreen } from '../../src/components/ui/AppScreen';
import { Card } from '../../src/components/ui/Card';
import { TextField } from '../../src/components/ui/TextField';
import { PasswordField } from '../../src/components/ui/PasswordField';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { LoadingView } from '../../src/components/LoadingView';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} from '../../src/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // Basic validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      clearError();
      await login({ email: email.trim(), password });

      // Get user role for navigation
      const user = useAuthStore.getState().user;
      if (user?.role === 'DRIVER') {
        router.replace('/driver' as Href);
      } else if (user?.role === 'RESTAURANT') {
        router.replace('/restaurant' as Href);
      }
    } catch (err) {
      // Error is already set in store
      console.error('Login failed:', err);
    }
  };

  // Show full-screen loading only on submission
  if (loading) {
    return (
      <AppScreen noPadding>
        <View style={styles.loadingContainer}>
          <LoadingView text="Signing in..." />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen noPadding>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>👋</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorContainer}>
              <ErrorBanner message={error} onDismiss={clearError} />
            </View>
          )}

          {/* Login Form */}
          <Card style={styles.formCard}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <PasswordField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
            />

            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.submitButton}
            />
          </Card>

          {/* Register Link */}
          <View style={styles.linkSection}>
            <Text style={styles.linkText}>Do not have an account?</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Create Account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl + spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.cardElevated,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.lg,
    color: colors.muted,
  },
  errorContainer: {
    marginBottom: spacing.md,
    marginHorizontal: -spacing.lg,
  },
  formCard: {
    marginBottom: spacing.xl,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  linkSection: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: typography.size.md,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  linkButton: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  linkButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
});
