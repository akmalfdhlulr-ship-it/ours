import React from 'react';
import { Tabs, type ErrorBoundaryProps } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomAnimatedTabBar } from '@/components/CustomAnimatedTabBar';

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return (
    <View style={errorStyles.container}>
      <Text style={errorStyles.title}>Gagal Memuat Navigasi</Text>
      <Text style={errorStyles.message}>{props.error?.message || 'Terjadi kesalahan sistem'}</Text>
      <TouchableOpacity onPress={props.retry} style={errorStyles.button}>
        <Text style={errorStyles.buttonText}>Muat Ulang Layar</Text>
      </TouchableOpacity>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9F7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202522',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#69746D',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 320,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

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
