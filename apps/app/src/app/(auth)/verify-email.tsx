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
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, verifyEmail, resendVerification, logout } = useAuth();

  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      setErrorMessage('Silakan masukkan token verifikasi akun Anda.');
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      await verifyEmail(code);
      router.replace('/');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Kode verifikasi tidak valid atau sudah kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage(null);
    setResending(true);
    try {
      await resendVerification();
      setInfoMessage('Kode verifikasi baru telah dikirimkan ke email Anda.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal mengirim ulang kode. Silakan coba sesaat lagi.');
    } finally {
      setResending(false);
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
            <Ionicons name="mail-unread-outline" size={22} color="#F43F5E" />
          </View>
          <Text style={styles.brandTitle}>OURS</Text>
          <Text style={styles.subtitle}>Verifikasi Email Anda</Text>
          <Text style={styles.caption}>
            Satu langkah lagi untuk memulai ruang kebersamaan yang privat dan istimewa
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.instructions}>
            Kami telah mengirimkan token verifikasi ke{' '}
            <Text style={styles.emailHighlight}>{user?.email || 'email Anda'}</Text>.
            Masukkan token untuk memverifikasi akun Anda:
          </Text>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {infoMessage && (
            <View style={styles.infoBanner}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
              <Text style={styles.infoBannerText}>{infoMessage}</Text>
            </View>
          )}

          <Input
            label="Token Verifikasi"
            placeholder="Tempel token verifikasi Anda di sini"
            value={code}
            onChangeText={(text: string) => {
              setCode(text);
              if (errorMessage) setErrorMessage(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Button
            title="Verifikasi Akun Sekarang"
            onPress={handleVerify}
            loading={loading}
            disabled={!code.trim()}
            style={styles.submitButton}
          />

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.resendLink}
            onPress={handleResend}
            disabled={resending}>
            <Text style={styles.resendText}>
              {resending ? 'Mengirim ulang...' : 'Belum menerima token? Kirim ulang kode'}
            </Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.footerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.logoutButton}
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}>
            <Ionicons name="log-out-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.logoutText}>Keluar & Masuk dengan Akun Lain</Text>
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
  instructions: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailHighlight: {
    fontWeight: '700',
    color: '#0F172A',
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
    textAlign: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  infoBannerText: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 6,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    height: 48,
  },
  resendLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  resendText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  footerRow: {
    marginTop: 24,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
