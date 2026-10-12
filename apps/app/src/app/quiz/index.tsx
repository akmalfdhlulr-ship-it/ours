import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { luminousColors } from '@ours/design-tokens';
import { useCoupleData } from '@/context/couple-data-context';

export default function LoveQuizScreen() {
  const router = useRouter();
  const {
    quizState,
    submitDanielAnswer,
    submitSasaAnswer,
    submitQuickPick,
    activeRole,
    setActiveRole,
    isNewCoupleMode,
    partnerNames,
  } = useCoupleData();

  // Input & reveal state
  const [userAnswer, setUserAnswer] = useState('');
  const [partnerSimAnswer, setPartnerSimAnswer] = useState('');
  const [selectedQuickPick, setSelectedQuickPick] = useState<'bioskop' | 'masak' | null>(null);
  const [isGraphModalVisible, setIsGraphModalVisible] = useState(false);

  const isAnswerRevealed =
    quizState.isRevealed || (!!quizState.danielAnswer && !!quizState.sasaAnswer);

  const danielAnswer = quizState.danielAnswer;
  const sasaAnswer = quizState.sasaAnswer;

  const handleSubmitAnswer = () => {
    const textToSubmit = userAnswer.trim();
    if (!textToSubmit) return;

    if (activeRole === 'sasa') {
      submitSasaAnswer(textToSubmit);
      if (partnerSimAnswer.trim()) {
        submitDanielAnswer(partnerSimAnswer.trim());
      }
    } else {
      submitDanielAnswer(textToSubmit);
      if (partnerSimAnswer.trim()) {
        submitSasaAnswer(partnerSimAnswer.trim());
      }
    }
    setUserAnswer('');
    setPartnerSimAnswer('');
  };

  const handleQuickPick = (choice: 'bioskop' | 'masak') => {
    setSelectedQuickPick(choice);
    submitQuickPick(choice);
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
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color={luminousColors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Love Quiz
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <Feather name="more-horizontal" size={20} color={luminousColors.onSurfaceVariant} />
          </TouchableOpacity>
          <View style={styles.avatarMini}>
            <Ionicons name="person" size={16} color={luminousColors.onPrimary} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ambient Radiant Mesh Underlay Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerLeft}>
              <View style={styles.bannerIconBadge}>
                <Ionicons name="heart" size={20} color={luminousColors.onPrimary} />
              </View>
              <View>
                <Text style={styles.bannerSub}>SPESIAL HARIAN</Text>
                <Text style={styles.bannerTitle}>Kuis Hati Berdua</Text>
              </View>
            </View>

            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakText}>
                {isNewCoupleMode ? `Streak ${quizState.streakDays || 1} Hari 🌱` : 'Streak 24 Hari'}
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Question Glass Card */}
        <View style={styles.questionCard}>
          <View style={styles.questionMetaRow}>
            <View style={styles.questionNumberPill}>
              <Feather name="help-circle" size={14} color={luminousColors.primary} />
              <Text style={styles.questionNumberText}>
                {isNewCoupleMode ? `Pertanyaan Hari Ini #${quizState.questionNumber || 1}` : 'Pertanyaan Hari Ini #142'}
              </Text>
            </View>
            <Text style={styles.categoryText}>Kategori: Nostalgia Manis</Text>
          </View>

          <Text style={styles.questionHeadline}>
            "Apa momen kencan kita yang paling bikin kamu ketawa lepas sampai sakit perut?"
          </Text>

          <Text style={styles.questionHint}>
            Jawaban pasangan akan terbuka secara bersamaan setelah kedua belah pihak mengirim jawaban masing-masing.
          </Text>

          {/* Dual Sync Status Bar */}
          <View style={styles.dualStatusBar}>
            {/* Partner 1's Status */}
            <View style={[styles.partnerStatusBox, activeRole === 'daniel' && styles.sasaStatusBox]}>
              <View style={styles.partnerInfoRow}>
                <View
                  style={[
                    styles.partnerAvatar,
                    {
                      backgroundColor: luminousColors.secondaryContainer,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}>
                  <Text
                    style={{
                      color: luminousColors.onSecondaryContainer,
                      fontWeight: '700',
                      fontSize: 13,
                    }}>
                    {partnerNames.partner?.[0] || 'P'}
                  </Text>
                </View>
                <Text style={styles.partnerName}>{partnerNames.partner} {activeRole === 'daniel' ? '(Aktif)' : ''}</Text>
                {quizState.danielAnswer ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={luminousColors.secondary}
                    style={{ marginLeft: 'auto' }}
                  />
                ) : (
                  <Feather
                    name="clock"
                    size={15}
                    color={luminousColors.onSurfaceVariant}
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </View>
              <View style={styles.lockStatusPill}>
                <Feather
                  name={isAnswerRevealed ? 'unlock' : quizState.danielAnswer ? 'lock' : 'edit-3'}
                  size={12}
                  color={luminousColors.onSurfaceVariant}
                />
                <Text style={styles.lockStatusText}>
                  {isAnswerRevealed
                    ? 'Terbuka ✨'
                    : quizState.danielAnswer
                    ? 'Sudah Menjawab 🔒'
                    : 'Menunggu Jawaban ⏳'}
                </Text>
              </View>
            </View>

            {/* Partner 2's Status */}
            <View style={[styles.partnerStatusBox, activeRole === 'sasa' && styles.sasaStatusBox]}>
              <View style={styles.partnerInfoRow}>
                <View
                  style={[
                    styles.partnerAvatar,
                    {
                      backgroundColor: luminousColors.primaryContainer,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}>
                  <Text
                    style={{
                      color: luminousColors.onPrimaryContainer,
                      fontWeight: '700',
                      fontSize: 13,
                    }}>
                    {partnerNames.user?.[0] || 'U'}
                  </Text>
                </View>
                <Text style={styles.partnerName}>{partnerNames.user} {activeRole === 'sasa' ? '(Kamu)' : ''}</Text>
                {quizState.sasaAnswer ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={luminousColors.primary}
                    style={{ marginLeft: 'auto' }}
                  />
                ) : (
                  <Feather
                    name="clock"
                    size={15}
                    color={luminousColors.onSurfaceVariant}
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </View>
              <View style={styles.turnStatusPill}>
                {!isAnswerRevealed && !quizState.sasaAnswer && <View style={styles.turnPingDot} />}
                <Text style={styles.turnStatusText}>
                  {isAnswerRevealed
                    ? 'Terbuka ✨'
                    : quizState.sasaAnswer
                    ? 'Sudah Menjawab 🔒'
                    : 'Menunggu Jawaban ⏳'}
                </Text>
              </View>
            </View>
          </View>

          {/* Input & Reveal Section */}
          {!isAnswerRevealed ? (
            <View style={styles.inputSection}>
              <View style={styles.textareaWrapper}>
                <TextInput
                  style={styles.answerTextarea}
                  placeholder="Tulis cerita lucumu di sini..."
                  placeholderTextColor={luminousColors.outline}
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                  multiline
                  numberOfLines={3}
                  maxLength={250}
                  textAlignVertical="top"
                />
                <View style={styles.textareaFooter}>
                  <TouchableOpacity
                    style={styles.emojiButton}
                    onPress={() => setUserAnswer((prev) => prev + ' 🤣')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="happy-outline"
                      size={16}
                      color={luminousColors.onSurfaceVariant}
                    />
                    <Text style={styles.emojiButtonText}>Tambah Emotikon</Text>
                  </TouchableOpacity>
                  <Text style={styles.charCounter}>{userAnswer.length} / 250</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitAnswer}
                activeOpacity={0.85}
              >
                <Feather name="unlock" size={18} color={luminousColors.onPrimary} />
                <Text style={styles.submitButtonText}>Kirim Jawaban & Buka Keduanya</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.revealedSection}>
              {/* Partner 1's Answer Bubble */}
              <View style={styles.revealedAnswerBoxDaniel}>
                <View style={styles.revealedAuthorRow}>
                  <Text style={styles.revealedAuthorTitle}>Jawaban {partnerNames.partner}:</Text>
                  <Ionicons name="sparkles" size={14} color={luminousColors.secondary} />
                </View>
                <Text style={styles.revealedText}>{danielAnswer}</Text>
              </View>

              {/* Partner 2's Answer Bubble */}
              <View style={styles.revealedAnswerBoxSasa}>
                <View style={styles.revealedAuthorRow}>
                  <Text style={styles.revealedAuthorTitleSasa}>Jawaban {partnerNames.user}:</Text>
                  <Ionicons name="heart" size={14} color={luminousColors.primary} />
                </View>
                <Text style={styles.revealedText}>{sasaAnswer}</Text>
              </View>

              <View style={styles.celebrationBanner}>
                <Ionicons name="sparkles" size={18} color={luminousColors.primary} />
                <Text style={styles.celebrationText}>
                  Jawaban Keduanya Terbuka! Kalian berdua selalu punya cara untuk tersenyum dan saling melengkapi.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Weekly Chemistry Summary Bento */}
        <View style={styles.bentoSection}>
          <View style={styles.bentoHeaderRow}>
            <Text style={styles.bentoSectionTitle}>Riwayat Chemistry Pekan Ini</Text>
            <TouchableOpacity onPress={() => setIsGraphModalVisible(true)} activeOpacity={0.7}>
              <Text style={styles.bentoLinkText}>Lihat Grafik</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bentoGrid}>
            {/* Card 1: Match Level with Ring */}
            <View style={styles.bentoCard}>
              <View style={styles.bentoCardHeader}>
                <Text style={styles.bentoLabel}>Love Match</Text>
                <View style={styles.infinityBadge}>
                  <Ionicons name="infinite" size={16} color={luminousColors.primary} />
                </View>
              </View>

              <View style={styles.ringContentRow}>
                {/* SVG Progress Ring */}
                <View style={styles.svgRingContainer}>
                  <Svg width={48} height={48} viewBox="0 0 36 36">
                    <Circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      stroke={luminousColors.surfaceContainerHigh}
                      strokeWidth="3.5"
                      fill="none"
                    />
                    <Circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      stroke={luminousColors.primary}
                      strokeWidth="3.5"
                      strokeDasharray="96, 100"
                      strokeLinecap="round"
                      fill="none"
                      transform="rotate(-90 18 18)"
                    />
                  </Svg>
                  <Text style={styles.ringPercentage}>96%</Text>
                </View>

                <View>
                  <Text style={styles.bentoMainVal}>Sangat Cocok</Text>
                  <Text style={styles.bentoSubVal}>Words of Affirmation</Text>
                </View>
              </View>
            </View>

            {/* Card 2: Top Memory */}
            <View style={styles.bentoCard}>
              <View style={styles.bentoCardHeader}>
                <Text style={styles.bentoLabel}>Top Memory</Text>
                <View style={styles.cameraBadge}>
                  <Feather name="camera" size={14} color={luminousColors.secondary} />
                </View>
              </View>

              <View style={styles.memoryContent}>
                <Text style={styles.memoryTitle} numberOfLines={1}>
                  Kehujanan di Menteng
                </Text>
                <Text style={styles.memoryQuote} numberOfLines={2}>
                  "Payung rusak, jas hujan robek tapi tertawa bahagia."
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Interactive Quick Pick Mini Games */}
        <View style={styles.quickPickContainer}>
          <View style={styles.quickPickHeaderRow}>
            <View style={styles.quickPickTitleGroup}>
              <Feather name="zap" size={18} color={luminousColors.primary} />
              <Text style={styles.quickPickTitle}>Pilih Cepat Berdua</Text>
            </View>
            <Text style={styles.quickPickSyncTag}>Sinkron Instan</Text>
          </View>

          {/* Mini Game Item 1 (Already agreed) */}
          <View style={styles.roundCard}>
            <View style={styles.roundMetaRow}>
              <Text style={styles.roundName}>Ronde 1</Text>
              <Text style={styles.roundAgreedTag}>Kalian Sepakat! 🎉</Text>
            </View>
            <View style={styles.choiceGrid}>
              <View style={[styles.choiceBtn, styles.choiceBtnSelected]}>
                <Text style={styles.choiceEmoji}>⛰️</Text>
                <Text style={[styles.choiceBtnText, styles.choiceBtnTextSelected]}>Gunung</Text>
                <Feather name="check" size={14} color={luminousColors.onPrimary} />
              </View>
              <View style={[styles.choiceBtn, styles.choiceBtnFaded]}>
                <Text style={styles.choiceEmoji}>🏖️</Text>
                <Text style={styles.choiceBtnTextFaded}>Pantai</Text>
              </View>
            </View>
          </View>

          {/* Mini Game Item 2 (Interactive) */}
          <View style={styles.roundCard}>
            <View style={styles.roundMetaRow}>
              <Text style={styles.roundName}>Ronde 2</Text>
              <Text style={styles.roundGuessTag}>Tebak Pilihan {partnerNames.partner}</Text>
            </View>
            <View style={styles.choiceGrid}>
              <TouchableOpacity
                style={[
                  styles.choiceBtn,
                  selectedQuickPick === 'bioskop'
                    ? styles.choiceBtnSelected
                    : styles.choiceBtnInteractive,
                ]}
                onPress={() => handleQuickPick('bioskop')}
                activeOpacity={0.8}
              >
                <Text style={styles.choiceEmoji}>🍿</Text>
                <Text
                  style={[
                    styles.choiceBtnText,
                    selectedQuickPick === 'bioskop' && styles.choiceBtnTextSelected,
                  ]}
                >
                  Nonton Bioskop
                </Text>
                {selectedQuickPick === 'bioskop' && (
                  <Feather name="check" size={14} color={luminousColors.onPrimary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.choiceBtn,
                  selectedQuickPick === 'masak'
                    ? styles.choiceBtnSelected
                    : styles.choiceBtnInteractive,
                ]}
                onPress={() => handleQuickPick('masak')}
                activeOpacity={0.8}
              >
                <Text style={styles.choiceEmoji}>🍳</Text>
                <Text
                  style={[
                    styles.choiceBtnText,
                    selectedQuickPick === 'masak' && styles.choiceBtnTextSelected,
                  ]}
                >
                  Masak di Rumah
                </Text>
                {selectedQuickPick === 'masak' && (
                  <Feather name="check" size={14} color={luminousColors.onPrimary} />
                )}
              </TouchableOpacity>
            </View>
            {selectedQuickPick && (
              <Text style={styles.quickPickFeedback}>
                ✨ Jawaban terkirim! Menunggu ketukan {partnerNames.partner}...
              </Text>
            )}
          </View>
        </View>

        {/* Decorative Partner Visual Snippet */}
        <View style={styles.filmPhotoBanner}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80',
            }}
            style={styles.filmPhotoBg}
          />
          <View style={styles.filmPhotoOverlay}>
            <Text style={styles.filmQuote}>"Cinta bertumbuh dari tawa kecil setiap hari."</Text>
            <Text style={styles.filmEdition}>OURS Daily Garden • Edisi 2025</Text>
          </View>
        </View>
      </ScrollView>

      {/* Chemistry Graph Modal */}
      <Modal
        visible={isGraphModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsGraphModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Grafik Chemistry Pekan Ini</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsGraphModalVisible(false)}
              >
                <Feather name="x" size={20} color={luminousColors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsList}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Komunikasi</Text>
                <View style={styles.statBarTrack}>
                  <View style={[styles.statBarFill, { width: '94%' }]} />
                </View>
                <Text style={styles.statValue}>94%</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Selera Humor</Text>
                <View style={styles.statBarTrack}>
                  <View style={[styles.statBarFill, { width: '98%', backgroundColor: luminousColors.secondary }]} />
                </View>
                <Text style={styles.statValue}>98%</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Rencana Masa Depan</Text>
                <View style={styles.statBarTrack}>
                  <View style={[styles.statBarFill, { width: '92%', backgroundColor: luminousColors.tertiary }]} />
                </View>
                <Text style={styles.statValue}>92%</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Aktivitas Kencan</Text>
                <View style={styles.statBarTrack}>
                  <View style={[styles.statBarFill, { width: '96%' }]} />
                </View>
                <Text style={styles.statValue}>96%</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseFullBtn}
              onPress={() => setIsGraphModalVisible(false)}
            >
              <Text style={styles.modalCloseFullBtnText}>Tutup Grafik</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
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
  },
  bannerCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255, 218, 219, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: luminousColors.onSurfaceVariant,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakFire: {
    fontSize: 13,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 28,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 20,
  },
  questionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  questionNumberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: luminousColors.primaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  questionNumberText: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.primary,
  },
  categoryText: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '500',
  },
  questionHeadline: {
    fontSize: 20,
    fontWeight: '700',
    color: luminousColors.onSurface,
    lineHeight: 28,
    marginBottom: 8,
  },
  questionHint: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 16,
  },
  dualStatusBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  partnerStatusBox: {
    flex: 1,
    backgroundColor: luminousColors.surfaceContainerLow,
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    gap: 8,
  },
  sasaStatusBox: {
    backgroundColor: 'rgba(255, 218, 219, 0.45)',
  },
  partnerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partnerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  partnerName: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  lockStatusPill: {
    backgroundColor: luminousColors.surfaceContainer,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  lockStatusText: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '500',
  },
  turnStatusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  turnPingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: luminousColors.primary,
  },
  turnStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  inputSection: {
    gap: 12,
  },
  textareaWrapper: {
    backgroundColor: luminousColors.surfaceContainerLow,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(227, 189, 191, 0.3)',
  },
  answerTextarea: {
    fontSize: 14,
    color: luminousColors.onSurface,
    lineHeight: 20,
    minHeight: 70,
  },
  textareaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  emojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emojiButtonText: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '500',
  },
  charCounter: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
  },
  submitButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: luminousColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: luminousColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: luminousColors.onPrimary,
  },
  revealedSection: {
    gap: 12,
    paddingTop: 4,
  },
  revealedAnswerBoxDaniel: {
    backgroundColor: 'rgba(196, 231, 255, 0.4)',
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  revealedAnswerBoxSasa: {
    backgroundColor: 'rgba(255, 218, 219, 0.45)',
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  revealedAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revealedAuthorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.secondary,
  },
  revealedAuthorTitleSasa: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  revealedText: {
    fontSize: 13,
    color: luminousColors.onSurface,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  celebrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(227, 189, 191, 0.3)',
  },
  celebrationText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.primary,
    lineHeight: 16,
  },
  bentoSection: {
    marginBottom: 20,
    gap: 12,
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  bentoSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  bentoLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'space-between',
    minHeight: 130,
  },
  bentoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoLabel: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '500',
  },
  infinityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: luminousColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(196, 231, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  svgRingContainer: {
    width: 48,
    height: 48,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercentage: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  bentoMainVal: {
    fontSize: 14,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  bentoSubVal: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
    marginTop: 2,
  },
  memoryContent: {
    marginTop: 8,
    gap: 2,
  },
  memoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  memoryQuote: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    lineHeight: 15,
  },
  quickPickContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    gap: 14,
  },
  quickPickHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickPickTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickPickTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  quickPickSyncTag: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '500',
  },
  roundCard: {
    backgroundColor: luminousColors.surfaceContainerLow,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  roundMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundName: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '600',
  },
  roundAgreedTag: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  roundGuessTag: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.secondary,
  },
  choiceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  choiceBtnInteractive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(227, 189, 191, 0.3)',
  },
  choiceBtnSelected: {
    backgroundColor: luminousColors.primary,
  },
  choiceBtnFaded: {
    backgroundColor: luminousColors.surfaceContainer,
    opacity: 0.6,
  },
  choiceEmoji: {
    fontSize: 14,
  },
  choiceBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  choiceBtnTextSelected: {
    color: luminousColors.onPrimary,
  },
  choiceBtnTextFaded: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    fontWeight: '500',
  },
  quickPickFeedback: {
    fontSize: 11,
    fontWeight: '600',
    color: luminousColors.primary,
    textAlign: 'center',
    marginTop: 4,
  },
  filmPhotoBanner: {
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  filmPhotoBg: {
    width: '100%',
    height: '100%',
  },
  filmPhotoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'rgba(19, 27, 46, 0.6)',
  },
  filmQuote: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  filmEdition: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: luminousColors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: luminousColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsList: {
    gap: 16,
    marginBottom: 24,
  },
  statRow: {
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: luminousColors.onSurface,
  },
  statBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: luminousColors.surfaceVariant,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: luminousColors.primary,
  },
  statValue: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.primary,
    alignSelf: 'flex-end',
  },
  modalCloseFullBtn: {
    height: 44,
    borderRadius: 22,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseFullBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: luminousColors.onPrimary,
  },
});
