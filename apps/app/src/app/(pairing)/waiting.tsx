import React, { useEffect, useState } from 'react';
import {
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function WaitingForPartnerScreen() {
  const router = useRouter();
  const {
    coupleSpace,
    pendingInvitation,
    generateInvitation,
    refresh,
    archiveSpace,
  } = useAuth();

  const [loadingInvite, setLoadingInvite] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Auto-generate invitation if not already loaded
  useEffect(() => {
    if (coupleSpace && !pendingInvitation) {
      setLoadingInvite(true);
      generateInvitation()
        .catch((err) => setErrorMessage(err?.message || 'Failed to generate invitation'))
        .finally(() => setLoadingInvite(false));
    }
  }, [coupleSpace, pendingInvitation, generateInvitation]);

  // Check if partner has already joined and activated space
  useEffect(() => {
    if (coupleSpace?.status === 'ACTIVE') {
      router.replace('/');
    }
  }, [coupleSpace, router]);

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    setErrorMessage(null);
    try {
      await refresh();
      if (coupleSpace?.status === 'ACTIVE') {
        router.replace('/');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not check status.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCopyCode = async () => {
    if (!pendingInvitation?.pairingCode) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(pendingInvitation.pairingCode);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Ignored
    }
  };

  const handleCopyLink = async () => {
    if (!pendingInvitation?.inviteUrl) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(pendingInvitation.inviteUrl);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignored
    }
  };

  const handleCancelSpace = async () => {
    setCancelling(true);
    try {
      await archiveSpace('ARCHIVE');
      router.replace('/(pairing)');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to cancel space');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Badge label="Menunggu pasangan terhubung" variant="warning" style={styles.badge} />
        <Text style={styles.title}>
          {coupleSpace?.name || 'Ruang Pasangan Anda'}
        </Text>
        <Text style={styles.subtitle}>
          Bagikan kode pasangan atau tautan undangan berikut agar pasangan Anda dapat bergabung.
        </Text>
      </View>

      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      )}

      <Card style={styles.codeCard}>
        <Text style={styles.codeLabel}>6 Karakter Kode Pasangan</Text>
        <View style={styles.codeDisplay}>
          <Text style={styles.codeText}>
            {pendingInvitation?.pairingCode || '......'}
          </Text>
        </View>

        <Button
          title={copiedCode ? 'Kode berhasil disalin!' : 'Salin Kode'}
          variant="secondary"
          onPress={handleCopyCode}
          disabled={!pendingInvitation?.pairingCode}
        />
      </Card>

      <Card style={styles.linkCard}>
        <Text style={styles.linkLabel}>Atau bagikan tautan undangan langsung</Text>
        <Text style={styles.linkSubtext} numberOfLines={2}>
          {pendingInvitation?.inviteUrl || 'Membuat tautan undangan...'}
        </Text>

        <Button
          title={copiedLink ? 'Tautan berhasil disalin!' : 'Salin Tautan Undangan'}
          variant="outline"
          size="sm"
          onPress={handleCopyLink}
          disabled={!pendingInvitation?.inviteUrl}
        />
      </Card>

      <Card variant="subtle" style={styles.expiryCard}>
        <Text style={styles.expiryText}>
          Undangan berlaku selama 72 jam. Membuat kode baru secara otomatis akan membatalkan kode sebelumnya.
        </Text>
      </Card>

      <View style={styles.actionButtons}>
        <Button
          title="Periksa apakah pasangan sudah bergabung"
          onPress={handleCheckStatus}
          loading={checkingStatus}
          style={styles.refreshButton}
        />

        <Button
          title="Batalkan ruang ini"
          variant="ghost"
          size="sm"
          onPress={handleCancelSpace}
          loading={cancelling}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: colors.functional.errorBackground,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F5C6C6',
    marginBottom: 16,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  codeCard: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeDisplay: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primaryBlue,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primaryBlue,
    letterSpacing: 6,
  },
  linkCard: {
    gap: 12,
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  linkSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
  },
  expiryCard: {
    padding: 14,
    marginBottom: 24,
  },
  expiryText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionButtons: {
    gap: 12,
    alignItems: 'center',
  },
  refreshButton: {
    width: '100%',
  },
});
