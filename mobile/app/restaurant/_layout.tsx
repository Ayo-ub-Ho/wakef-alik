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
 * Restaurant area layout with bottom tabs navigation
 */
export default function RestaurantLayout() {
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
      {/* My Requests Tab (Home) */}
      <Tabs.Screen
        name="requests/index"
        options={{
          title: 'My Requests',
          tabBarIcon: ({ focused }) => <TabIcon icon="📦" focused={focused} />,
        }}
      />

      {/* Create Request Tab */}
      <Tabs.Screen
        name="requests/new"
        options={{
          title: 'Create',
          tabBarIcon: ({ focused }) => <TabIcon icon="➕" focused={focused} />,
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
        name="index"
        options={{
          href: null, // Hide from tab bar - redirects to requests
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null, // History is now part of My Requests tabs
        }}
      />
      <Tabs.Screen
        name="profile-edit"
        options={{
          href: null, // Profile edit screen
        }}
      />
      <Tabs.Screen
        name="requests/[id]"
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
