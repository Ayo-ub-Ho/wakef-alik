/**
 * TextField - Stitch-styled text input with label and error support
 */
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import {
  colors,
  typography,
  spacing,
  radius,
  layout,
} from '../../theme/tokens';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  /** Field label */
  label: string;
  /** Current value */
  value: string;
  /** Change handler */
  onChangeText: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Container style */
  containerStyle?: ViewStyle;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  disabled = false,
  containerStyle,
  ...textInputProps
}: TextFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        editable={!disabled}
        {...textInputProps}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: layout.inputHeight,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.size.lg,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: colors.bgDark,
    color: colors.muted,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
