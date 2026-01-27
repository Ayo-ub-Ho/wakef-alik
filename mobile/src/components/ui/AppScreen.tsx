/**
 * AppScreen - Safe area wrapper with optional scroll
 */
import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '../../theme/tokens';

interface AppScreenProps {
  children: React.ReactNode;
  /** Enable scrolling */
  scroll?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Extra padding at bottom (for tab bar) */
  tabBarPadding?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** Disable horizontal padding */
  noPadding?: boolean;
  /** Edge to edge content (no safe area) */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function AppScreen({
  children,
  scroll = false,
  backgroundColor = colors.bg,
  tabBarPadding = false,
  style,
  noPadding = false,
  edges = ['top', 'left', 'right'],
}: AppScreenProps) {
  const contentStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    ...(noPadding ? {} : { paddingHorizontal: layout.screenPaddingHorizontal }),
    ...(tabBarPadding
      ? { paddingBottom: layout.tabBarHeight + spacing.lg }
      : {}),
    ...style,
  };

  const content = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        tabBarPadding && { paddingBottom: layout.tabBarHeight + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[contentStyle, { flex: undefined }]}>{children}</View>
    </ScrollView>
  ) : (
    <View style={contentStyle}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={edges}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={backgroundColor}
        translucent={false}
      />
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default AppScreen;
