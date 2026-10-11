import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { colors } from '@ours/design-tokens';
import { Ionicons } from '@expo/vector-icons';

export interface CustomTabBarProps {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  descriptors: Record<string, { options: any }>;
  navigation: {
    emit: (event: any) => any;
    navigate: (name: string) => void;
  };
}

interface TabConfig {
  name: string;
  label: string;
  iconFocused: keyof typeof Ionicons.glyphMap;
  iconUnfocused: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    name: 'index',
    label: 'Beranda',
    iconFocused: 'home',
    iconUnfocused: 'home-outline',
  },
  explore: {
    name: 'explore',
    label: 'Jelajah',
    iconFocused: 'search',
    iconUnfocused: 'search-outline',
  },
  dates: {
    name: 'dates',
    label: 'Kalender',
    iconFocused: 'calendar',
    iconUnfocused: 'calendar-outline',
  },
  visits: {
    name: 'visits',
    label: 'Pengeluaran',
    iconFocused: 'wallet',
    iconUnfocused: 'wallet-outline',
  },
  hub: {
    name: 'hub',
    label: 'Lainnya',
    iconFocused: 'menu',
    iconUnfocused: 'menu-outline',
  },
};

function AnimatedTabItem({
  route,
  isFocused,
  onPress,
  onLongPress,
}: {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const config = TAB_CONFIGS[route.name] || {
    name: route.name,
    label: route.name,
    iconFocused: 'ellipse',
    iconUnfocused: 'ellipse-outline',
  };

  const [scaleAnim] = useState(() => new Animated.Value(isFocused ? 1.12 : 1));
  const [pillOpacity] = useState(() => new Animated.Value(isFocused ? 1 : 0));
  const [pillScale] = useState(() => new Animated.Value(isFocused ? 1 : 0.85));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.15 : 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(pillOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(pillScale, {
        toValue: isFocused ? 1 : 0.85,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.15 : 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={config.label}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
      activeOpacity={0.85}>
      {/* Animated active pill background */}
      <Animated.View
        style={[
          styles.activePill,
          {
            opacity: pillOpacity,
            transform: [{ scale: pillScale }],
          },
        ]}
      />

      {/* Animated Icon */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={isFocused ? config.iconFocused : config.iconUnfocused}
          size={20}
          color={isFocused ? '#1F2937' : '#8A92A0'}
        />
      </Animated.View>

      {/* Label */}
      <Text
        style={[
          styles.tabLabel,
          isFocused ? styles.tabLabelFocused : styles.tabLabelUnfocused,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail">
        {config.label}
      </Text>

      {/* Subtle bottom indicator dot when active */}
      {isFocused && <View style={styles.activeDot} />}
    </TouchableOpacity>
  );
}

export function CustomAnimatedTabBar({
  state,
  descriptors,
  navigation,
}: any) {
  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute?.key]?.options;
  if (focusedOptions?.tabBarStyle?.display === 'none') {
    return null;
  }

  return (
    <View style={styles.floatingContainer}>
      <View style={styles.barCard}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <AnimatedTabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 999,
  },
  barCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 500,
    height: 66,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 30,
    paddingHorizontal: 8,
    borderWidth: 1.2,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        } as any)
      : {}),
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 6,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  activePill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 4,
    right: 4,
    backgroundColor: '#FFE8EC',
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  tabLabelFocused: {
    color: '#1F2937',
    fontWeight: '800',
  },
  tabLabelUnfocused: {
    color: '#8A92A0',
    fontWeight: '600',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF3366',
    position: 'absolute',
    bottom: 4,
  },
});
