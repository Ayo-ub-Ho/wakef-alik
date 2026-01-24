import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingViewProps {
  text?: string;
  color?: string;
}

/**
 * Centered loading spinner with optional text
 */
export function LoadingView({
  text = 'Loading...',
  color = '#007AFF',
}: LoadingViewProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
