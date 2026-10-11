import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/auth-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F8F9F7' },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />
          <Stack.Screen name="(auth)/verify-email" />
          <Stack.Screen name="(auth)/forgot-password" />
          <Stack.Screen name="(auth)/reset-password" />
          <Stack.Screen name="(pairing)/index" />
          <Stack.Screen name="(pairing)/create" />
          <Stack.Screen name="(pairing)/waiting" />
          <Stack.Screen name="(pairing)/join" />
          <Stack.Screen name="(pairing)/preview" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(pairing)/settings" />
          <Stack.Screen name="(pairing)/archived" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
