// @ts-ignore
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export function CustomTabBar({ state, descriptors, navigation }: any) {
  const currentRouteName = state.routes[state.index].name;
  const currentBaseName = currentRouteName.replace(/\/index$/, '');
  const allowedRoutes = ['index', 'tasks', 'notifications', 'profile'];

  // HIDE entire tab bar if the current screen is not a main tab
  if (!allowedRoutes.includes(currentBaseName)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {state.routes.map((route: any, index: number) => {
          const baseName = route.name.replace(/\/index$/, '');
          
          if (!allowedRoutes.includes(baseName)) {
            return null;
          }

          const { options } = descriptors[route.key];

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : baseName; // Fallback to base name if title is missing

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Map route names to icons exactly as requested
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle';
          let activeIconName: keyof typeof Ionicons.glyphMap = 'help-circle';

          if (baseName === 'index') {
            iconName = 'home-outline';
            activeIconName = 'home';
          } else if (baseName === 'tasks') {
            iconName = 'briefcase-outline';
            activeIconName = 'briefcase';
          } else if (baseName === 'notifications') {
            iconName = 'notifications-outline';
            activeIconName = 'notifications';
          } else if (baseName === 'profile') {
            iconName = 'person-outline';
            activeIconName = 'person';
          }

          return (
            <Pressable
              key={route.key}
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
            >
              <Ionicons 
                name={isFocused ? activeIconName : iconName} 
                size={24} 
                color={isFocused ? colors.primary : colors.muted} 
              />
              <Text 
                style={[
                  styles.tabLabel, 
                  { color: isFocused ? colors.primary : colors.muted }
                ]}
              >
                {label as string}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Extra padding for iPhone home indicator
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64, // Exact fixed height to prevent squishing
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : undefined,
    alignSelf: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 4, // Spacing between icon and text
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  }
});
