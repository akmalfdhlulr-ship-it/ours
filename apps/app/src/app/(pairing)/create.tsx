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
import { Ionicons } from '@expo/vector-icons';

export default function CreateSpaceScreen() {
  const router = useRouter();
  const { createSpace } = useAuth();

  const [spaceName, setSpaceName] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      await createSpace(
        spaceName.trim() || undefined,
        anniversaryDate.trim() || undefined,
      );
      router.replace('/(pairing)/waiting');
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Gagal membuat ruang pasangan. Silakan coba lagi.',
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
            <Ionicons name="heart" size={24} color="#F43F5E" />
          </View>
          <Text style={styles.title}>Beri Nama Ruang Pasangan</Text>
          <Text style={styles.subtitle}>
            Personalisasi ruang Anda. Anda selalu dapat mengubahnya nanti di pengaturan.
          </Text>
        </View>

        <Card style={styles.card}>
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          <Input
            label="Nama Ruang (opsional)"
            placeholder="Contoh: Alex & Jordan"
            value={spaceName}
            onChangeText={setSpaceName}
            hint="Jika dikosongkan, Anda dapat mengaturnya bersama nanti."
          />

          <Input
            label="Tanggal Jadian / Anniversary (opsional)"
            placeholder="YYYY-MM-DD (Contoh: 2024-06-15)"
            value={anniversaryDate}
            onChangeText={setAnniversaryDate}
            hint="Digunakan untuk menandai momen pencapaian spesial hubungan Anda."
          />

          <Button
            title="Buat Ruang Pasangan"
            onPress={handleCreate}
            loading={loading}
            style={styles.submitButton}
          />
        </Card>

        <View style={styles.footerRow}>
          <Button
            title="Batal"
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
    marginBottom: 28,
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
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  card: {
    gap: 16,
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
  },
  submitButton: {
    marginTop: 8,
  },
  footerRow: {
    marginTop: 20,
    alignItems: 'center',
  },
});
