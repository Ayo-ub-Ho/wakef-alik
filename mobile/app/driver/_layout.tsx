import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { colors, typography, shadows } from '../../src/theme/tokens';

/**
 * Tab bar icon component
 */
function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
      {icon}
    </Text>
  );
}

/**
 * Driver area layout with bottom tabs navigation
 */
export default function DriverLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* Orders / Dashboard Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => <TabIcon icon="📦" focused={focused} />,
        }}
      />

      {/* Earnings Tab */}
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ focused }) => <TabIcon icon="💰" focused={focused} />,
        }}
      />

      {/* History Tab */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />

      {/* Hidden screens (not in tab bar) */}
      <Tabs.Screen
        name="nearby"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="deliveries"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="request/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 80,
    paddingTop: 8,
    paddingBottom: 20,
    ...shadows.tabBar,
  },
  tabLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    marginTop: 4,
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
});
