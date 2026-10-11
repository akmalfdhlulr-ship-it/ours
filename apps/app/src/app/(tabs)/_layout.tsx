import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomAnimatedTabBar } from '@/components/CustomAnimatedTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomAnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Jelajah',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dates"
        options={{
          title: 'Kalender',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="visits"
        options={{
          title: 'Pengeluaran',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          title: 'Lainnya',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={size || 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
