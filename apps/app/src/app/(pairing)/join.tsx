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
import { colors } from '@ours/design-tokens';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CodeBox } from '@/components/ui/code-box';
import { Ionicons } from '@expo/vector-icons';

export default function JoinSpaceScreen() {
  const router = useRouter();
  const { joinByCode, joinByToken } = useAuth();

  const [mode, setMode] = useState<'code' | 'token'>('code');
  const [pairingCode, setPairingCode] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoinByCode = async () => {
    if (pairingCode.length !== 6) {
      setErrorMessage('Silakan masukkan 6 karakter kode pasangan lengkap.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await joinByCode(pairingCode);
      router.replace('/');
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'Kode pasangan tidak valid atau sudah kedaluwarsa. Silakan periksa kembali dengan pasangan Anda.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByToken = async () => {
    // Extract token from full URL if user pasted a link
    let cleanToken = tokenInput.trim();
    if (cleanToken.includes('token=')) {
      const match = cleanToken.match(/token=([a-f0-9]+)/i);
      if (match && match[1]) {
        cleanToken = match[1];
      }
    }

    if (!cleanToken) {
      setErrorMessage('Silakan tempel tautan undangan atau token yang valid.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await joinByToken(cleanToken);
      router.replace('/');
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'Undangan tidak valid, telah kedaluwarsa, atau sudah diterima sebelumnya.',
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
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="link-outline" size={24} color="#F43F5E" />
          </View>
          <Text style={styles.title}>Gabung ke Ruang Pasangan</Text>
          <Text style={styles.subtitle}>
            Masukkan detail pasangan yang dikirimkan oleh pasangan Anda untuk menghubungkan akun berdua.
          </Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.tabToggleRow}>
            <Button
              title="Kode Pasangan"
              variant={mode === 'code' ? 'primary' : 'ghost'}
              size="sm"
              onPress={() => {
                setMode('code');
                setErrorMessage(null);
              }}
              style={styles.tabButton}
            />
            <Button
              title="Tautan / Token Undangan"
              variant={mode === 'token' ? 'primary' : 'ghost'}
              size="sm"
              onPress={() => {
                setMode('token');
                setErrorMessage(null);
              }}
              style={styles.tabButton}
            />
          </View>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {mode === 'code' ? (
            <View style={styles.codeSection}>
              <Text style={styles.instructions}>
                Masukkan 6 karakter kode alfanumerik pasangan:
              </Text>

              <CodeBox
                value={pairingCode}
                onChange={(val) => {
                  setPairingCode(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                length={6}
              />

              <Button
                title="Hubungkan Ruang"
                onPress={handleJoinByCode}
                loading={loading}
                disabled={pairingCode.length !== 6}
                style={styles.submitButton}
              />

              <Text style={styles.rateLimitHint}>
                Demi keamanan, percobaan kode pasangan dibatasi maksimal 5 kali per 15 menit.
              </Text>
            </View>
          ) : (
            <View style={styles.tokenSection}>
              <Input
                label="Tautan undangan atau token"
                placeholder="Tempel URL lengkap atau token 64 karakter"
                value={tokenInput}
                onChangeText={(text) => {
                  setTokenInput(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="none"
              />

              <Button
                title="Hubungkan Ruang"
                onPress={handleJoinByToken}
                loading={loading}
                disabled={!tokenInput.trim()}
                style={styles.submitButton}
              />
            </View>
          )}
        </Card>

        <View style={styles.footerRow}>
          <Button
            title="Kembali ke Pilihan"
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    gap: 16,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    minHeight: 38,
  },
  errorBanner: {
    backgroundColor: colors.functional.errorBackground,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F5C6C6',
  },
  errorBannerText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  codeSection: {
    alignItems: 'center',
    gap: 12,
  },
  instructions: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tokenSection: {
    gap: 16,
  },
  submitButton: {
    width: '100%',
    marginTop: 8,
  },
  rateLimitHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  footerRow: {
    marginTop: 20,
    alignItems: 'center',
  },
});
