import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { UiverseLoginForm } from '@/components/free-components/UiverseLoginForm';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, pass: string) => {
    if (!email.trim() || !pass) {
      setErrorMessage('Silakan masukkan alamat email dan kata sandi Anda.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await login(email.trim(), pass);
      router.replace('/');
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'Gagal masuk. Silakan periksa kembali email dan kata sandi Anda.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Stitch Editorial Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="heart" size={22} color="#F43F5E" />
          </View>
          <Text style={styles.brandTitle}>OURS</Text>
          <Text style={styles.editorialHeading}>Masuk ke Ruang Kita</Text>
          <Text style={styles.subtitle}>
            Ruang privat eksklusif untuk Anda dan pasangan tercinta.
          </Text>
        </View>

        {/* Uiverse Form Card Integration */}
        <View style={styles.formCard}>
          <UiverseLoginForm
            onSubmit={handleLogin}
            onForgotPassword={() => router.push('/(auth)/forgot-password')}
            onRegisterPress={() => router.push('/(auth)/register')}
            isLoading={loading}
            errorMessage={errorMessage}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8F9F7',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 28,
    alignItems: 'center',
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6EBFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3657D6',
    letterSpacing: 2,
    marginBottom: 4,
  },
  editorialHeading: {
    fontSize: 26,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#202522',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#69746D',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECEFEA',
    padding: 24,
    shadowColor: '#202522',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
});
