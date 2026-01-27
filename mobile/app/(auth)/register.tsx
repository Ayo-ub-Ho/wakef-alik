/**
 * Register Screen - Stitch Style
 */
import React, { useState, useEffect } from 'react';
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
import { useRouter, Link, Href, useLocalSearchParams } from 'expo-router';
import { useAuthStore, UserRole } from '../../src/stores/auth.store';
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

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { register, loading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('DRIVER');

  // Set role from params if provided
  const roleFromParams =
    params.role === 'DRIVER' || params.role === 'RESTAURANT';

  useEffect(() => {
    if (params.role === 'DRIVER' || params.role === 'RESTAURANT') {
      setRole(params.role);
    }
  }, [params.role]);

  const handleRegister = async () => {
    // Basic validation
    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password.trim()
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      clearError();
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
      });

      // Get user role for navigation
      const user = useAuthStore.getState().user;
      if (user?.role === 'DRIVER') {
        router.replace('/driver' as Href);
      } else if (user?.role === 'RESTAURANT') {
        router.replace('/restaurant' as Href);
      }
    } catch (err) {
      // Error is already set in store
      console.error('Registration failed:', err);
    }
  };

  // Show full-screen loading only on submission
  if (loading) {
    return (
      <AppScreen noPadding>
        <View style={styles.loadingContainer}>
          <LoadingView text="Creating your account..." />
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
              <Text style={styles.logoEmoji}>✨</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorContainer}>
              <ErrorBanner message={error} onDismiss={clearError} />
            </View>
          )}

          {/* Role Selection (show only if not passed from params) */}
          {!roleFromParams && (
            <Card style={styles.roleCard}>
              <Text style={styles.roleLabel}>I AM A...</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'DRIVER' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('DRIVER')}
                >
                  <Text style={styles.roleIcon}>🛵</Text>
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'DRIVER' && styles.roleButtonTextActive,
                    ]}
                  >
                    Driver
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'RESTAURANT' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('RESTAURANT')}
                >
                  <Text style={styles.roleIcon}>🍽️</Text>
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'RESTAURANT' && styles.roleButtonTextActive,
                    ]}
                  >
                    Restaurant
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Selected Role Badge (when role is from params) */}
          {roleFromParams && (
            <View style={styles.selectedRoleBadge}>
              <Text style={styles.selectedRoleIcon}>
                {role === 'DRIVER' ? '🛵' : '🍽️'}
              </Text>
              <Text style={styles.selectedRoleText}>
                {role === 'DRIVER' ? 'Delivery Driver' : 'Restaurant Owner'}
              </Text>
            </View>
          )}

          {/* Register Form */}
          <Card style={styles.formCard}>
            <TextField
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />

            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextField
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />

            <PasswordField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
            />

            <PrimaryButton
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.submitButton}
            />
          </Card>

          {/* Login Link */}
          <View style={styles.linkSection}>
            <Text style={styles.linkText}>Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Sign In</Text>
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
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
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
  roleCard: {
    marginBottom: spacing.lg,
  },
  roleLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  roleButton: {
    flex: 1,
    backgroundColor: colors.bgDark,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  roleIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  roleButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.muted,
  },
  roleButtonTextActive: {
    color: colors.text,
  },
  selectedRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    alignSelf: 'center',
    ...shadows.card,
  },
  selectedRoleIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  selectedRoleText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text,
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
