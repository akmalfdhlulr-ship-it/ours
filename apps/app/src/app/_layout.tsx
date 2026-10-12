import React from 'react';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthProvider } from '@/context/auth-context';
import { CoupleDataProvider } from '@/context/couple-data-context';

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return (
    <View style={errorStyles.container}>
      <Text style={errorStyles.title}>Terjadi Kendala Teknis</Text>
      <Text style={errorStyles.message}>{props.error?.message || 'Gagal memuat tampilan aplikasi'}</Text>
      <TouchableOpacity onPress={props.retry} style={errorStyles.button}>
        <Text style={errorStyles.buttonText}>Muat Ulang</Text>
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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CoupleDataProvider>
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
          <Stack.Screen name="explore/map" />
          <Stack.Screen name="places/[id]" />
          <Stack.Screen name="dates/planner" />
          <Stack.Screen name="receipts/scan" />
          <Stack.Screen name="receipts/[id]" />
          <Stack.Screen name="memories/index" />
          <Stack.Screen name="wishlist/index" />
          <Stack.Screen name="time-capsule/index" />
          <Stack.Screen name="quiz/index" />
        </Stack>
        </CoupleDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
