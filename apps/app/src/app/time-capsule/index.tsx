import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { luminousColors } from '@ours/design-tokens';
import { useCoupleData, SharedLetter } from '../../context/couple-data-context';

export default function TimeCapsuleScreen() {
  const router = useRouter();
  const {
    letters,
    activeCapsule,
    addLetter,
    unlockLetter,
    refreshLetters,
    sendHeartbeat,
    partnerNames,
    activeRole,
  } = useCoupleData();

  useEffect(() => {
    refreshLetters?.().catch(() => {});
  }, [refreshLetters]);

  // State for tactile vibration feedback
  const [pulseState, setPulseState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [selectedLetter, setSelectedLetter] = useState<SharedLetter | null>(null);
  const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
  const [letterType, setLetterType] = useState<'open' | 'sealed'>('open');
  const [newLetterTitle, setNewLetterTitle] = useState('');
  const [newLetterBody, setNewLetterBody] = useState('');
  const [newLetterDate, setNewLetterDate] = useState('1 Bulan Lagi');
  const [newSender, setNewSender] = useState<string>(partnerNames.user);

  const handleSendWarmPulse = () => {
    if (pulseState !== 'idle') return;
    setPulseState('sending');
    sendHeartbeat(partnerNames.user);
    setTimeout(() => {
      setPulseState('sent');
      setTimeout(() => {
        setPulseState('idle');
      }, 2500);
    }, 900);
  };

  const handleSaveCapsule = async () => {
    if (!newLetterTitle.trim() || !newLetterBody.trim()) {
      Alert.alert('Lengkapi Surat', 'Judul dan isi surat wajib diisi.');
      return;
    }

    const isDirect = letterType === 'open';
    const recipient = newSender === partnerNames.user ? partnerNames.partner : partnerNames.user;

    await addLetter(
      {
        title: newLetterTitle.trim(),
        sender: newSender,
        recipient: recipient,
        sealedDate: 'Hari Ini',
        unlockDate: isDirect ? 'Hari Ini' : newLetterDate,
        fullText: newLetterBody.trim(),
        wordCount: newLetterBody.trim().split(/\s+/).length,
        preview: `"${newLetterBody.trim().substring(0, 95)}..."`,
        mood: isDirect ? 'Surat Kasih Terbuka' : 'Kapsul Waktu Rahasia',
        moodIcon: isDirect ? 'heart-outline' : 'lock-closed',
        secretTeaser: isDirect
          ? `Surat manis dari ${newSender} untuk dibaca berdua 💕`
          : `Surat rahasia dari ${newSender}... Jangan diintip sebelum waktunya tiba! 🔒✨`,
      },
      isDirect
    );

    setIsWriteModalVisible(false);
    setNewLetterTitle('');
    setNewLetterBody('');

    if (isDirect) {
      Alert.alert(
        'Surat Kasih Terkirim! 💌',
        `Surat cinta berhasil tersimpan di ruang kalian. Kamu dan ${partnerNames.partner} bisa langsung membaca surat ini berdua kapan saja!`
      );
    } else {
      Alert.alert(
        'Kapsul Tersegel! 🔒',
        `Surat berhasil dikunci aman di Awan Kasih. ${partnerNames.partner} akan melihat amplop terkunci ini dengan hitung mundur menuju ${newLetterDate}.`
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <Feather name="chevron-left" size={24} color={luminousColors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Secret Love Letter
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setIsWriteModalVisible(true)}
            activeOpacity={0.7}>
            <Feather name="edit-3" size={18} color={luminousColors.primary} />
          </TouchableOpacity>
          <View style={styles.avatarMini}>
            <Ionicons name="person" size={16} color={luminousColors.onPrimary} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Subtle Ambient Glow Orbs */}
        <View style={styles.ambientGlowTopLeft} />
        <View style={styles.ambientGlowTopRight} />

        {/* Status Meta Chip */}
        <View style={styles.statusMetaRow}>
          <View style={styles.statusBadge}>
            <View style={styles.pulsingDot} />
            <Text style={styles.statusBadgeText}>
              {activeCapsule ? '1 Surat Menunggu Dibuka' : 'Kapsul Waktu Cinta'}
            </Text>
          </View>

          <View style={styles.cloudMeta}>
            <Feather name="lock" size={13} color={luminousColors.tertiary} />
            <Text style={styles.cloudMetaText}>Tersimpan di Awan Kasih</Text>
          </View>
        </View>

        {/* ---------------- ACTIVE SEALED CAPSULE CARD ---------------- */}
        {activeCapsule ? (
          <View style={styles.envelopeCard}>
            {/* Wax Stamp Seal */}
            <View style={styles.waxSealOuter}>
              <View style={styles.waxSealInner}>
                <Ionicons name="heart" size={32} color={luminousColors.onPrimary} />
                <View style={styles.waxRimGlint} />
              </View>
              <View style={styles.sparkleBadge}>
                <Ionicons name="sparkles" size={13} color={luminousColors.primaryContainer} />
              </View>
            </View>

            <Text style={styles.envelopeSubtitle}>KAPSUL WAKTU EKSKLUSIF</Text>
            <Text style={styles.envelopeTitle}>
              Untuk {activeCapsule.recipient}, dari {activeCapsule.sender}
            </Text>

            {/* Countdown Pill Glass Container */}
            <View style={styles.countdownContainer}>
              <View style={styles.countdownHeaderRow}>
                <Feather name="clock" size={16} color={luminousColors.primary} />
                <Text style={styles.countdownHeaderTitle}>Menghitung Hari Menuju Pembukaan</Text>
              </View>

              <Text style={styles.countdownTargetText}>
                Terbuka otomatis pada{' '}
                <Text style={styles.countdownTargetBold}>{activeCapsule.unlockDate}</Text>
              </Text>

              {/* Micro Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '85%' }]} />
              </View>

              <View style={styles.progressLabelsRow}>
                <Text style={styles.progressLabelText}>Disegel {activeCapsule.sealedDate}</Text>
                <Text style={styles.progressLabelText}>Tersimpan Aman</Text>
                <Text style={styles.progressLabelText}>{activeCapsule.unlockDate}</Text>
              </View>
            </View>

            {/* Teaser Message Cardlet */}
            <View style={styles.teaserCard}>
              <View style={styles.quoteIconBox}>
                <MaterialCommunityIcons
                  name="format-quote-open"
                  size={18}
                  color={luminousColors.primary}
                />
              </View>
              <View style={styles.teaserContent}>
                <View style={styles.teaserHeader}>
                  <Text style={styles.teaserSender}>Bisikan Rahasia {activeCapsule.sender}</Text>
                  <Feather name="lock" size={13} color={luminousColors.onSurfaceVariant} />
                </View>
                <Text style={styles.teaserQuote}>
                  {activeCapsule.secretTeaser ||
                    '"Surat ini terkunci rapat. Tunggu saat tanggal spesial tiba ya! 🔒✨"'}
                </Text>
              </View>
            </View>

            {/* Interactive Vibration Button */}
            <TouchableOpacity
              style={[
                styles.vibrationButton,
                pulseState === 'sending' && styles.vibrationButtonSending,
                pulseState === 'sent' && styles.vibrationButtonSent,
              ]}
              onPress={handleSendWarmPulse}
              activeOpacity={0.8}>
              {pulseState === 'idle' && (
                <>
                  <Ionicons name="heart-outline" size={18} color={luminousColors.primary} />
                  <Text style={styles.vibrationButtonText}>Sentuh untuk Kirim Getaran Hangat</Text>
                </>
              )}
              {pulseState === 'sending' && (
                <>
                  <Ionicons name="heart" size={18} color={luminousColors.primary} />
                  <Text style={styles.vibrationButtonTextSending}>
                    Getaran Terkirim ke {partnerNames.partner}...
                  </Text>
                </>
              )}
              {pulseState === 'sent' && (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={luminousColors.primary} />
                  <Text style={styles.vibrationButtonTextSent}>
                    {partnerNames.partner} Menerima Pelukanmu ❤️
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Dev/Test Unlock Button */}
            <TouchableOpacity
              style={styles.testUnlockBtn}
              onPress={() => unlockLetter(activeCapsule.id)}>
              <Text style={styles.testUnlockText}>🔓 Buka Kapsul Ini Sekarang (Uji Coba)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Empty Active Capsule Prompt */
          <View style={styles.emptyEnvelopeCard}>
            <View style={styles.emptySealCircle}>
              <Ionicons name="mail-unread-outline" size={36} color={luminousColors.primary} />
            </View>
            <Text style={styles.emptyEnvelopeTitle}>Mulai Kapsul Waktu Pertama 🌱</Text>
            <Text style={styles.emptyEnvelopeDesc}>
              Tulis pesan cinta rahasia untuk {partnerNames.partner}. Kamu bisa menentukan tanggal di
              masa depan saat surat ini terbuka secara otomatis!
            </Text>
            <TouchableOpacity
              style={styles.writeFirstBtn}
              onPress={() => setIsWriteModalVisible(true)}
              activeOpacity={0.88}>
              <Feather name="feather" size={18} color="#FFFFFF" />
              <Text style={styles.writeFirstBtnText}>+ Tulis Surat Kapsul Rahasia</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Section: Riwayat Kapsul Terbuka */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Feather name="mail" size={18} color={luminousColors.primary} />
            <Text style={styles.sectionTitle}>Riwayat Kapsul Terbuka</Text>
          </View>
          <Text style={styles.sectionCountText}>{letters.length} Kenangan</Text>
        </View>

        {/* Letters List */}
        {letters.length === 0 ? (
          <View style={styles.cleanHistoryEmpty}>
            <Ionicons name="file-tray-outline" size={32} color={luminousColors.outline} />
            <Text style={styles.cleanHistoryEmptyText}>
              Belum ada surat yang terbuka. Kapsul waktu yang disegel akan masuk ke sini setelah
              tanggalnya tiba!
            </Text>
          </View>
        ) : (
          <View style={styles.lettersContainer}>
            {letters.map((letter) => (
              <View key={letter.id} style={styles.letterCard}>
                <View style={styles.letterCardHeader}>
                  <View style={styles.letterAuthorGroup}>
                    <View style={styles.letterIconBox}>
                      <Ionicons
                        name="mail-open-outline"
                        size={20}
                        color={luminousColors.primary}
                      />
                    </View>
                    <View>
                      <Text style={styles.letterTitle}>{letter.title}</Text>
                      <Text style={styles.letterDate}>
                        Oleh {letter.sender} • Dibuka {letter.unlockDate}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.wordCountPill}>
                    <Text style={styles.wordCountText}>{letter.wordCount} Kata</Text>
                  </View>
                </View>

                <Text style={styles.letterPreview} numberOfLines={2}>
                  {letter.preview}
                </Text>

                <View style={styles.letterCardFooter}>
                  <View style={styles.letterMoodRow}>
                    <Ionicons name="heart" size={14} color={luminousColors.primary} />
                    <Text style={styles.letterMoodText}>{letter.mood}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.readAgainBtn}
                    onPress={() => setSelectedLetter(letter)}
                    activeOpacity={0.7}>
                    <Text style={styles.readAgainText}>Baca Penuh</Text>
                    <Feather name="chevron-right" size={16} color={luminousColors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Action Glass Island */}
        <View style={styles.bottomCtaContainer}>
          <TouchableOpacity
            style={styles.primaryCta}
            onPress={() => setIsWriteModalVisible(true)}
            activeOpacity={0.85}>
            <Feather name="edit-3" size={18} color={luminousColors.onPrimary} />
            <Text style={styles.primaryCtaText}>Tulis Surat Kapsul Waktu Baru</Text>
          </TouchableOpacity>
          <Text style={styles.encryptionNotice}>
            Terkunci aman dengan enkripsi kasih sayang dua arah (keduanya dapat membaca saat terbuka)
          </Text>
        </View>
      </ScrollView>

      {/* Read Letter Modal */}
      <Modal
        visible={!!selectedLetter}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedLetter(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalStampIcon}>
                <Ionicons name="mail-open" size={22} color={luminousColors.primary} />
              </View>
              <View style={styles.modalHeaderTextContainer}>
                <Text style={styles.modalTitle}>{selectedLetter?.title}</Text>
                <Text style={styles.modalSubtitle}>
                  Dari {selectedLetter?.sender} untuk {selectedLetter?.recipient}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedLetter(null)}>
                <Feather name="x" size={20} color={luminousColors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.letterScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.paperContainer}>
                <Text style={styles.letterFullContent}>{selectedLetter?.fullText}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => setSelectedLetter(null)}>
              <Text style={styles.modalActionBtnText}>Tutup Surat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Write New Capsule Modal */}
      <Modal
        visible={isWriteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsWriteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalStampIcon}>
                <Feather name="feather" size={20} color={luminousColors.primary} />
              </View>
              <View style={styles.modalHeaderTextContainer}>
                <Text style={styles.modalTitle}>Tulis Kapsul Waktu</Text>
                <Text style={styles.modalSubtitle}>Surat rahasia untuk pasangan tercinta</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsWriteModalVisible(false)}>
                <Feather name="x" size={20} color={luminousColors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.writeFormScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Tipe Surat</Text>
              <View style={styles.senderSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.senderChip,
                    letterType === 'open' && styles.senderChipActive,
                  ]}
                  onPress={() => setLetterType('open')}>
                  <Text
                    style={[
                      styles.senderChipText,
                      letterType === 'open' && styles.senderChipTextActive,
                    ]}>
                    💌 Surat Kasih Terbuka (Langsung Dibaca)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.senderChip,
                    letterType === 'sealed' && styles.senderChipActive,
                  ]}
                  onPress={() => setLetterType('sealed')}>
                  <Text
                    style={[
                      styles.senderChipText,
                      letterType === 'sealed' && styles.senderChipTextActive,
                    ]}>
                    🔒 Kapsul Rahasia (Disegel)
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>Siapa yang Menulis?</Text>
              <View style={styles.senderSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.senderChip,
                    newSender === partnerNames.user && styles.senderChipActive,
                  ]}
                  onPress={() => setNewSender(partnerNames.user)}>
                  <Text
                    style={[
                      styles.senderChipText,
                      newSender === partnerNames.user && styles.senderChipTextActive,
                    ]}>
                    {partnerNames.user} (Untuk {partnerNames.partner})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.senderChip,
                    newSender === partnerNames.partner && styles.senderChipActive,
                  ]}
                  onPress={() => setNewSender(partnerNames.partner)}>
                  <Text
                    style={[
                      styles.senderChipText,
                      newSender === partnerNames.partner && styles.senderChipTextActive,
                    ]}>
                    {partnerNames.partner} (Untuk {partnerNames.user})
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>
                {letterType === 'open' ? 'Judul Surat Kasih' : 'Judul Kapsul Waktu'}
              </Text>
              <TextInput
                style={styles.inputField}
                placeholder={
                  letterType === 'open'
                    ? 'Contoh: Untuk Hari-Hari Cerah Kita Bersama'
                    : 'Contoh: Kejutan Spesial Ulang Tahun Kita'
                }
                placeholderTextColor={luminousColors.outline}
                value={newLetterTitle}
                onChangeText={setNewLetterTitle}
              />

              {letterType === 'sealed' && (
                <>
                  <Text style={styles.formLabel}>Waktu Terbuka Otomatis</Text>
                  <View style={styles.dateSelectorRow}>
                    {['30 Apr 2025', '12 Okt 2025', '31 Des 2025'].map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dateChip, newLetterDate === d && styles.dateChipActive]}
                        onPress={() => setNewLetterDate(d)}>
                        <Text
                          style={[
                            styles.dateChipText,
                            newLetterDate === d && styles.dateChipTextActive,
                          ]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.formLabel}>
                {letterType === 'open' ? 'Isi Surat Kasih' : 'Isi Surat Rahasia'}
              </Text>
              <TextInput
                style={[styles.inputField, styles.textareaField]}
                placeholder={
                  letterType === 'open'
                    ? 'Tuliskan pesan kasih sayangmu. Surat ini akan langsung muncul dan bisa dibaca berdua kapan pun...'
                    : 'Tuliskan isi hatimu yang terdalam. Ini hanya akan bisa dibaca oleh pasangan pada tanggal yang kamu tentukan...'
                }
                placeholderTextColor={luminousColors.outline}
                value={newLetterBody}
                onChangeText={setNewLetterBody}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.modalActionBtn,
                (!newLetterTitle.trim() || !newLetterBody.trim()) && styles.modalActionBtnDisabled,
              ]}
              onPress={handleSaveCapsule}
              disabled={!newLetterTitle.trim() || !newLetterBody.trim()}>
              <Feather
                name={letterType === 'open' ? 'send' : 'lock'}
                size={16}
                color={luminousColors.onPrimary}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.modalActionBtnText}>
                {letterType === 'open'
                  ? 'Kirim Surat Kasih Sekarang 💌'
                  : 'Segel & Kunci Kapsul 🔒'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: luminousColors.surface,
  },
  header: {
    height: 60,
    marginTop: StatusBar.currentHeight || 44,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(250, 248, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(227, 189, 191, 0.2)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: luminousColors.onSurface,
    maxWidth: 200,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 218, 219, 0.5)',
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    position: 'relative',
  },
  ambientGlowTopLeft: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 218, 219, 0.45)',
  },
  ambientGlowTopRight: {
    position: 'absolute',
    top: 60,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(196, 231, 255, 0.35)',
  },
  statusMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 231, 255, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: luminousColors.primary,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.primary,
  },
  cloudMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cloudMetaText: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '500',
  },
  envelopeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: luminousColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 24,
  },
  emptyEnvelopeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  emptySealCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: luminousColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEnvelopeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: luminousColors.onSurface,
  },
  emptyEnvelopeDesc: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  writeFirstBtn: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 23,
    backgroundColor: luminousColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  writeFirstBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  waxSealOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 218, 219, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  waxSealInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: luminousColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  waxRimGlint: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  sparkleBadge: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  envelopeSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: luminousColors.tertiary,
    marginBottom: 4,
  },
  envelopeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: luminousColors.onSurface,
    marginBottom: 16,
  },
  countdownContainer: {
    width: '100%',
    backgroundColor: 'rgba(234, 237, 255, 0.65)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  countdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  countdownHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  countdownTargetText: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  countdownTargetBold: {
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: luminousColors.surfaceVariant,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: luminousColors.primary,
  },
  progressLabelsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelText: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
  },
  teaserCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(242, 243, 255, 0.95)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  quoteIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: luminousColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teaserContent: {
    flex: 1,
  },
  teaserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  teaserSender: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  teaserQuote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: luminousColors.onSurfaceVariant,
    lineHeight: 18,
  },
  vibrationButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(226, 231, 255, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  vibrationButtonSending: {
    backgroundColor: 'rgba(255, 218, 219, 0.6)',
  },
  vibrationButtonSent: {
    backgroundColor: 'rgba(216, 232, 218, 0.8)',
  },
  vibrationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  vibrationButtonTextSending: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  vibrationButtonTextSent: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  testUnlockBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  testUnlockText: {
    fontSize: 11,
    color: luminousColors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: luminousColors.onSurfaceVariant,
  },
  cleanHistoryEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  cleanHistoryEmptyText: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  lettersContainer: {
    gap: 12,
    marginBottom: 24,
  },
  letterCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  letterCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  letterAuthorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  letterIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 218, 219, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  letterDate: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    marginTop: 2,
  },
  wordCountPill: {
    backgroundColor: luminousColors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  wordCountText: {
    fontSize: 11,
    fontWeight: '500',
    color: luminousColors.onSurfaceVariant,
  },
  letterPreview: {
    fontSize: 12,
    lineHeight: 18,
    color: luminousColors.onSurfaceVariant,
    marginBottom: 12,
    paddingLeft: 4,
  },
  letterCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(227, 189, 191, 0.15)',
  },
  letterMoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  letterMoodText: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.primary,
  },
  readAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readAgainText: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  bottomCtaContainer: {
    alignItems: 'center',
    gap: 8,
  },
  primaryCta: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: luminousColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: luminousColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  primaryCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: luminousColors.onPrimary,
  },
  encryptionNotice: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: luminousColors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalStampIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: luminousColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalHeaderTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  modalSubtitle: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: luminousColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterScroll: {
    maxHeight: 380,
    marginBottom: 18,
  },
  paperContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(227, 189, 191, 0.3)',
  },
  letterFullContent: {
    fontSize: 14,
    lineHeight: 24,
    color: luminousColors.onSurface,
    fontStyle: 'italic',
  },
  modalActionBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: luminousColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionBtnDisabled: {
    backgroundColor: luminousColors.surfaceVariant,
  },
  modalActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: luminousColors.onPrimary,
  },
  writeFormScroll: {
    maxHeight: 400,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.onSurface,
    marginBottom: 6,
    marginTop: 10,
  },
  senderSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  senderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: luminousColors.surfaceContainer,
    alignItems: 'center',
  },
  senderChipActive: {
    backgroundColor: luminousColors.primary,
  },
  senderChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.onSurfaceVariant,
  },
  senderChipTextActive: {
    color: luminousColors.onPrimary,
    fontWeight: '700',
  },
  inputField: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: luminousColors.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(227, 189, 191, 0.4)',
  },
  textareaField: {
    height: 120,
    textAlignVertical: 'top',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  dateChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: luminousColors.surfaceContainer,
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: luminousColors.primary,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: luminousColors.onSurfaceVariant,
  },
  dateChipTextActive: {
    color: luminousColors.onPrimary,
  },
});
