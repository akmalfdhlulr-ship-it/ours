import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@ours/design-tokens';
import { InvitationPreviewResponse } from '@ours/contracts';
import { api } from '@/services/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Ionicons } from '@expo/vector-icons';

export default function InvitationPreviewScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { user, joinByToken } = useAuth();

  const [preview, setPreview] = useState<InvitationPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorMessage('Token undangan tidak ditemukan atau tidak lengkap.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const data = await api.invitations.preview(token);
        if (isMounted) setPreview(data);
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(
            err?.message ||
              'Tautan undangan ini tidak valid, telah kedaluwarsa, atau sudah diterima sebelumnya.',
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    setJoining(true);
    setErrorMessage(null);

    try {
      await joinByToken(token);
      router.replace('/');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menerima undangan pasangan.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Memuat informasi undangan pasangan...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {/* Editorial Header */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Ionicons name="heart" size={24} color="#F43F5E" />
        </View>
        <Text style={styles.brandTitle}>OURS</Text>
        <Text style={styles.title}>Undangan Pasangan</Text>
      </View>

      <Card style={styles.card}>
        {errorMessage ? (
          <View style={styles.errorContent}>
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
            <Button
              title="Kembali ke Beranda"
              variant="outline"
              onPress={() => router.replace('/')}
              style={styles.actionButton}
            />
          </View>
        ) : preview ? (
          <View style={styles.previewContent}>
            <Text style={styles.inviterText}>
              <Text style={styles.bold}>{preview.createdByName}</Text> mengundang Anda untuk terhubung di ruang:
            </Text>

            <View style={styles.spaceNameBox}>
              <Ionicons name="sparkles" size={18} color="#F43F5E" />
              <Text style={styles.spaceNameText}>
                {preview.spaceName || 'Ruang Pasangan'}
              </Text>
            </View>

            <Text style={styles.explanationText}>
              Menerima undangan ini akan menyatukan akun Anda berdua ke dalam ruang privat eksklusif untuk kenangan, kalender kencan, dan rencana masa depan.
            </Text>

            <Button
              title={user ? 'Terima & Hubungkan Ruang' : 'Masuk untuk Menerima Undangan'}
              onPress={handleAccept}
              loading={joining}
              style={styles.actionButton}
            />
          </View>
        ) : null}
      </Card>

      <View style={styles.footerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => router.replace('/')}>
          <Ionicons name="arrow-back-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.backButtonText}>Batal & Kembali</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF9F6',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  card: {
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
  previewContent: {
    gap: 18,
    alignItems: 'center',
  },
  inviterText: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  spaceNameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
  },
  spaceNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F43F5E',
    textAlign: 'center',
  },
  explanationText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  actionButton: {
    width: '100%',
    marginTop: 8,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    height: 48,
  },
  errorContent: {
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
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
