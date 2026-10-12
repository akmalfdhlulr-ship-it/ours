import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@ours/design-tokens';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ code?: string }>();
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Silakan isi email dan kata sandi Anda.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Kata sandi minimal harus terdiri dari 8 karakter.');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setErrorMessage('Kata sandi harus mengandung minimal 1 huruf besar, 1 huruf kecil, dan 1 angka.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const resolvedDisplayName =
        displayName.trim() ||
        email.trim().split('@')[0] ||
        'Partner';

      await register(
        email.trim(),
        password,
        resolvedDisplayName,
        searchParams.code ? searchParams.code.trim().toUpperCase() : undefined,
      );
      router.replace('/');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Pendaftaran gagal. Silakan coba lagi.');
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
            <Ionicons name="heart" size={20} color="#F43F5E" />
          </View>
          <Text style={styles.brandTitle}>OURS</Text>
          <Text style={styles.editorialHeading}>Mulai Kisah Cinta</Text>
          <Text style={styles.subtitle}>
            Daftar akun untuk membangun ruang kencan privat bersama pasangan Anda.
          </Text>
        </View>

        <View style={styles.formCard}>
          {searchParams.code ? (
            <View style={styles.pairingCodeBanner}>
              <Ionicons name="link" size={16} color="#2563EB" style={{ marginRight: 6 }} />
              <Text style={styles.pairingCodeBannerText}>
                Menghubungkan ke pasangan dengan kode:{' '}
                <Text style={{ fontWeight: '700' }}>{searchParams.code}</Text>
              </Text>
            </View>
          ) : null}

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          <Input
            label="Nama Panggilan (opsional)"
            placeholder="Contoh: Alex"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Input
            label="Alamat Email"
            placeholder="nama@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errorMessage) setErrorMessage(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Kata Sandi"
            placeholder="Min 8 karakter (huruf besar, kecil, angka)"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errorMessage) setErrorMessage(null);
            }}
            secureTextEntry
          />

          <Input
            label="Konfirmasi Kata Sandi"
            placeholder="Ulangi kata sandi Anda"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errorMessage) setErrorMessage(null);
            }}
            secureTextEntry
          />

          <Button
            title="Daftar Akun Baru"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Sudah memiliki akun?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLinkText}>Masuk Sekarang</Text>
          </TouchableOpacity>
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
    marginBottom: 26,
    alignItems: 'center',
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D8E8DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D5B37',
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
    padding: 20,
    shadowColor: '#202522',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  pairingCodeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  pairingCodeBannerText: {
    color: '#1D4ED8',
    fontSize: 12,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  submitButton: {
    marginTop: 6,
  },
  footerRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: '#69746D',
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3657D6',
  },
});
