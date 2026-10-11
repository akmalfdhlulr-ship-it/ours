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
import { useRouter } from 'expo-router';
import { colors } from '@ours/design-tokens';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const router = useRouter();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!token.trim() || !password) {
      setErrorMessage('Silakan masukkan token pemulihan dan kata sandi baru Anda.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Kata sandi baru minimal harus memiliki 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      await api.auth.resetPassword({ token: token.trim(), newPassword: password });
      setSuccessMessage('Kata sandi berhasil diperbarui! Mengalihkan ke halaman masuk...');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Token pemulihan tidak valid atau sudah kedaluwarsa.');
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
            <Ionicons name="lock-closed-outline" size={22} color="#F43F5E" />
          </View>
          <Text style={styles.brandTitle}>OURS</Text>
          <Text style={styles.subtitle}>Atur Kata Sandi Baru</Text>
          <Text style={styles.caption}>
            Masukkan token 64 karakter dari email Anda dan buat kata sandi baru yang aman
          </Text>
        </View>

        <Card style={styles.card}>
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {successMessage && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
          )}

          <Input
            label="Token Pemulihan"
            placeholder="Tempel token 64 karakter dari email"
            value={token}
            onChangeText={(text) => {
              setToken(text);
              if (errorMessage) setErrorMessage(null);
            }}
            autoCapitalize="none"
          />

          <Input
            label="Kata Sandi Baru"
            placeholder="Minimal 8 karakter"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errorMessage) setErrorMessage(null);
            }}
            secureTextEntry
          />

          <Input
            label="Konfirmasi Kata Sandi Baru"
            placeholder="Ketik ulang kata sandi baru"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errorMessage) setErrorMessage(null);
            }}
            secureTextEntry
          />

          <Button
            title="Perbarui Kata Sandi"
            onPress={handleReset}
            loading={loading}
            style={styles.submitButton}
          />
        </Card>

        <View style={styles.footerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={() => router.push('/(auth)/login')}>
            <Ionicons name="arrow-back-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.backButtonText}>Batal & Kembali ke Halaman Masuk</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 480,
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
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  caption: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  card: {
    gap: 16,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  successBannerText: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  submitButton: {
    marginTop: 6,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    height: 48,
  },
  footerRow: {
    marginTop: 24,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
