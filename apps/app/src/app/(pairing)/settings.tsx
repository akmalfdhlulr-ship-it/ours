import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@ours/design-tokens';
import { useAuth } from '@/context/auth-context';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SpaceSettingsScreen() {
  const router = useRouter();
  const { coupleSpace, refresh, archiveSpace } = useAuth();

  const [name, setName] = useState(coupleSpace?.name || '');
  const [anniversary, setAnniversary] = useState(
    coupleSpace?.anniversaryDate || '',
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Unpair modal state
  const [showUnpairModal, setShowUnpairModal] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [unpairing, setUnpairing] = useState(false);
  const [unpairError, setUnpairError] = useState<string | null>(null);

  const handleSaveSettings = async () => {
    if (!coupleSpace) return;
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      await api.spaces.update(coupleSpace.id, {
        name: name.trim() || undefined,
        anniversaryDate: anniversary.trim() || undefined,
      });
      await refresh();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memperbarui pengaturan ruang.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnpair = async () => {
    if (confirmPhrase !== 'ARCHIVE') {
      setUnpairError('Anda harus mengetik tepat ARCHIVE untuk konfirmasi.');
      return;
    }

    setUnpairing(true);
    setUnpairError(null);

    try {
      await archiveSpace('ARCHIVE');
      setShowUnpairModal(false);
      router.replace('/(pairing)');
    } catch (err: any) {
      setUnpairError(err?.message || 'Gagal memutuskan hubungan ruang.');
    } finally {
      setUnpairing(false);
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
          <Text style={styles.title}>Pengaturan Ruang Pasangan</Text>
          <Text style={styles.subtitle}>
            Kelola preferensi ruang bersama dan keanggotaan pasangan Anda.
          </Text>
        </View>

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        {saveSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>
              Pengaturan berhasil disimpan.
            </Text>
          </View>
        )}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Detail Ruang</Text>

          <Input
            label="Nama Ruang"
            placeholder="Contoh: Alex & Jordan"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="Tanggal Anniversary"
            placeholder="YYYY-MM-DD"
            value={anniversary}
            onChangeText={setAnniversary}
            hint="Tanggal momen spesial hubungan Anda."
          />

          <Button
            title="Simpan Perubahan"
            onPress={handleSaveSettings}
            loading={saving}
            style={styles.saveButton}
          />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Anggota</Text>
          <View style={styles.membersList}>
            {coupleSpace?.members?.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.displayName}</Text>
                  <Text style={styles.memberJoined}>
                    Bergabung {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('id-ID') : ''}
                  </Text>
                </View>
                <Badge
                  label={member.role === 'CREATOR' ? 'Pembuat' : 'Pasangan'}
                  variant={member.role === 'CREATOR' ? 'primary' : 'neutral'}
                />
              </View>
            ))}
          </View>
        </Card>

        {/* Destructive Unpair Section */}
        <Card variant="subtle" style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Putuskan & Arsipkan Ruang</Text>
          <Text style={styles.dangerText}>
            Memutuskan hubungan akan mengarsipkan seluruh konten bersama, mencabut akses pasangan, dan memungkinkan Anda berdua untuk membuat atau bergabung ke ruang baru.
          </Text>
          <Button
            title="Putuskan Hubungan Pasangan"
            variant="destructive"
            onPress={() => {
              setConfirmPhrase('');
              setUnpairError(null);
              setShowUnpairModal(true);
            }}
          />
        </Card>

        <View style={styles.footerRow}>
          <Button
            title="Kembali ke Beranda"
            variant="ghost"
            size="sm"
            onPress={() => router.replace('/')}
          />
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showUnpairModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnpairModal(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>Konfirmasi Pemutusan Hubungan</Text>
            <Text style={styles.modalDescription}>
              Ini akan langsung mengarsipkan ruang bersama Anda. Untuk konfirmasi, ketik{' '}
              <Text style={styles.boldRed}>ARCHIVE</Text> di bawah ini.
            </Text>

            {unpairError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{unpairError}</Text>
              </View>
            )}

            <Input
              placeholder="Ketik ARCHIVE"
              value={confirmPhrase}
              onChangeText={setConfirmPhrase}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <Button
                title="Konfirmasi & Arsipkan"
                variant="destructive"
                onPress={handleUnpair}
                loading={unpairing}
                disabled={confirmPhrase !== 'ARCHIVE'}
                style={styles.modalButton}
              />
              <Button
                title="Batal"
                variant="outline"
                onPress={() => setShowUnpairModal(false)}
                disabled={unpairing}
                style={styles.modalButton}
              />
            </View>
          </Card>
        </View>
      </Modal>
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
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
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
  successBanner: {
    backgroundColor: colors.functional.successBackground,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6EAD3',
  },
  successBannerText: {
    color: colors.functional.success,
    fontSize: 13,
    fontWeight: '500',
  },
  sectionCard: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  saveButton: {
    marginTop: 4,
  },
  membersList: {
    gap: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberInfo: {
    gap: 2,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  memberJoined: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dangerCard: {
    borderColor: '#F3C5C5',
    backgroundColor: '#FEF9F9',
    gap: 12,
    marginTop: 8,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
  },
  dangerText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footerRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    maxWidth: 440,
    width: '100%',
    gap: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.error,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  boldRed: {
    fontWeight: '700',
    color: colors.error,
  },
  modalActions: {
    gap: 8,
    marginTop: 8,
  },
  modalButton: {
    width: '100%',
  },
});
