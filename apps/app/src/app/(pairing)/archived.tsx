import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@ours/design-tokens';
import { ArchivedSpaceMetadata } from '@ours/contracts';
import { useAuth } from '@/context/auth-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ionicons } from '@expo/vector-icons';

export default function ArchivedSpacesScreen() {
  const router = useRouter();
  const { getArchivedSpaces } = useAuth();

  const [archivedSpaces, setArchivedSpaces] = useState<ArchivedSpaceMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getArchivedSpaces();
        setArchivedSpaces(data);
      } catch {
        // Ignored
      } finally {
        setLoading(false);
      }
    })();
  }, [getArchivedSpaces]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="archive-outline" size={24} color="#F43F5E" />
        </View>
        <Text style={styles.title}>Ruang Terarsip</Text>
        <Text style={styles.subtitle}>
          Riwayat ruang pasangan sebelumnya yang telah dinonaktifkan (hanya baca).
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Memuat arsip ruang pasangan...</Text>
        </View>
      ) : archivedSpaces.length === 0 ? (
        <Card variant="subtle" style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="file-tray-outline" size={32} color={colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Ruang Terarsip</Text>
          <Text style={styles.emptyDescription}>
            Anda belum memiliki riwayat ruang pasangan yang diarsipkan.
          </Text>
        </Card>
      ) : (
        <View style={styles.spacesList}>
          {archivedSpaces.map((space) => (
            <Card key={space.spaceId} style={styles.spaceCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderTitleRow}>
                  <Ionicons name="heart-dislike-outline" size={18} color="#64748B" />
                  <Text style={styles.spaceName}>{space.name || 'Ruang Pasangan'}</Text>
                </View>
                <Badge label="Terarsip" variant="neutral" />
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Pasangan:</Text>
                <Text style={styles.detailValue}>{space.partners.join(' & ')}</Text>
              </View>

              {space.anniversaryDate && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailLabel}>Tanggal Jadian:</Text>
                  <Text style={styles.detailValue}>{space.anniversaryDate}</Text>
                </View>
              )}

              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Diarsipkan pada:</Text>
                <Text style={styles.detailValue}>
                  {space.archivedAt ? new Date(space.archivedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      <View style={styles.footerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.backButtonText}>Kembali ke Sebelumnya</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF9F6',
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
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  spacesList: {
    gap: 16,
  },
  spaceCard: {
    gap: 12,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spaceName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  footerRow: {
    marginTop: 28,
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
