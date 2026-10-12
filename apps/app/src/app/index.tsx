import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, luminousColors } from '@ours/design-tokens';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Exact Hero Image from Stitch Screen 01
const ONBOARDING_HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA1nEsUVpbvGWcbB1kZS-K0khw4K14n00UkZGckxZCq8xqCxaVta9VvdEGtmYsnlDsYqaa8wetEnzXdCZ9ZUS4VwTFL7WxvdrABFPAqo6jhaJDEL0X1Yg35xwuIUkhIWx5Y1oiWNZbCtoaGbn9y5fmB8DyHDA6R0n4XcLZgLnu34ZuCDuQiB1ia1lwOBHlCELLwzUKkS_UcJ3HsZrZuoyaQHTkDnpRtggSUh0H3B5SQXl8rcYEK3BPpdQ';

export default function HomeScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ token?: string }>();
  const { user, coupleSpace, lifecycleState, isLoading, logout } = useAuth();

  // Bottom Sheet State
  const [sheetVisible, setSheetVisible] = useState(false);
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  // Animated pulse for "Terhubung Real-Time" indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  // Handle deep link token if passed to root (e.g. /?token=...)
  useEffect(() => {
    if (searchParams.token) {
      router.replace(`/(pairing)/preview?token=${searchParams.token}`);
      return;
    }

    if (!isLoading) {
      if (lifecycleState === 'AUTHENTICATED_UNVERIFIED') {
        router.replace('/(auth)/verify-email');
      } else if (lifecycleState === 'VERIFIED_WITHOUT_SPACE') {
        router.replace('/(pairing)');
      } else if (lifecycleState === 'VERIFIED_WITH_PENDING_SPACE') {
        router.replace('/(pairing)/waiting');
      } else if (lifecycleState === 'VERIFIED_WITH_ACTIVE_SPACE') {
        router.replace('/(tabs)' as any);
      }
    }
  }, [isLoading, lifecycleState, searchParams.token, router]);

  const handleCopyCode = () => {
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2200);
  };

  const handleConnectCode = () => {
    const code = partnerCodeInput.trim().toUpperCase();
    if (!code) {
      setPairingError('Silakan masukkan kode pasangan terlebih dahulu.');
      return;
    }
    setPairingError(null);
    setSheetVisible(false);
    // If user is unauthenticated, redirect to registration/login pre-filling code
    router.push(`/(auth)/register?code=${encodeURIComponent(code)}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.brandRowSimple}>
          <Ionicons name="heart" size={24} color={luminousColors.primary} />
          <Text style={styles.brandTitle}>OURS</Text>
        </View>
        <ActivityIndicator size="large" color={luminousColors.primary} />
      </View>
    );
  }

  // -------------------------------------------------------------
  // SCREEN 01: Onboarding (Clean Glass) — 100% Faithful Port
  // -------------------------------------------------------------
  if (lifecycleState === 'UNAUTHENTICATED') {
    return (
      <View style={styles.screenRoot}>
        {/* Ambient Soft Radiant Glows from Stitch CSS */}
        <View style={styles.ambientGlowTopLeft} pointerEvents="none" />
        <View style={styles.ambientGlowRight} pointerEvents="none" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}>
          {/* Hero Visual Glass Card */}
          <View style={styles.heroGlassCard}>
            <View style={styles.heroInnerContainer}>
              <Image
                source={{ uri: ONBOARDING_HERO_IMAGE }}
                style={styles.heroImage}
                resizeMode="cover"
              />

              {/* Soft Scrim Gradient Overlay */}
              <View style={styles.heroScrim} />

              {/* Floating Connection Pill (Micro-Delight: Terhubung Real-Time) */}
              <View style={styles.connectionPill}>
                <View style={styles.pulseContainer}>
                  <Animated.View
                    style={[
                      styles.pingDot,
                      {
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseAnim.interpolate({
                          inputRange: [1, 1.5],
                          outputRange: [0.8, 0],
                        }),
                      },
                    ]}
                  />
                  <View style={styles.solidDot} />
                </View>
                <Text style={styles.connectionPillText}>Terhubung Real-Time</Text>
              </View>

              {/* Partner Presence Indicators (K & D Avatars + Heart) */}
              <View style={styles.presencePill}>
                <View style={styles.avatarK}>
                  <Text style={styles.avatarKText}>K</Text>
                </View>
                <View style={styles.avatarD}>
                  <Text style={styles.avatarDText}>D</Text>
                </View>
                <Ionicons name="heart" size={14} color={luminousColors.primary} style={styles.presenceHeart} />
              </View>
            </View>
          </View>

          {/* Intimate Headline & Narrative */}
          <View style={styles.headerSection}>
            <View style={styles.kickerRow}>
              <Ionicons name="sparkles" size={14} color={luminousColors.primary} />
              <Text style={styles.kickerText}>RUANG KHUSUS KITA</Text>
            </View>
            <h1 style={{ display: 'none' }}>Ruang Intim Kalian Berdua</h1>
            <Text style={styles.mainHeadline}>Ruang Intim Kalian Berdua</Text>
            <Text style={styles.mainSubtitle}>
              Rencanakan kencan impian, kelola tabungan bersama, dan rawat cinta setiap hari dalam satu taman digital.
            </Text>
          </View>

          {/* Feature Highlights (Frosted Soft Cards) */}
          <View style={styles.featuresList}>
            {/* Feature 1: Jelajah Kencan */}
            <View style={styles.featureCard}>
              <View style={styles.iconCircleTertiary}>
                <Ionicons name="compass" size={24} color="#891933" />
              </View>
              <View style={styles.featureTextWrapper}>
                <Text style={styles.featureTitle}>Jelajah Kencan</Text>
                <Text style={styles.featureSubtitle}>
                  Rekomendasi momen manis yang dirancang berdua
                </Text>
              </View>
            </View>

            {/* Feature 2: Dompet Transparan */}
            <View style={styles.featureCard}>
              <View style={styles.iconCircleSecondary}>
                <Ionicons name="wallet" size={22} color="#001E2C" />
              </View>
              <View style={styles.featureTextWrapper}>
                <Text style={styles.featureTitle}>Dompet Transparan</Text>
                <Text style={styles.featureSubtitle}>
                  Kelola tabungan liburan dan masa depan tanpa canggung
                </Text>
              </View>
            </View>

            {/* Feature 3: Scrapbook Abadi */}
            <View style={styles.featureCard}>
              <View style={styles.iconCirclePrimary}>
                <Ionicons name="book" size={22} color="#400010" />
              </View>
              <View style={styles.featureTextWrapper}>
                <Text style={styles.featureTitle}>Scrapbook Abadi</Text>
                <Text style={styles.featureSubtitle}>
                  Koleksi foto polaroid, surat rahasia, & hari jadian
                </Text>
              </View>
            </View>
          </View>

          {/* Primary Action Area */}
          <View style={styles.actionSection}>
            {/* Mulai Bersama Button */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.88}>
              <Text style={styles.primaryBtnText}>Mulai Bersama</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Secondary Pairing Code Link */}
            <TouchableOpacity
              style={styles.secondaryCodeBtn}
              onPress={() => setSheetVisible(true)}
              activeOpacity={0.8}>
              <Ionicons name="key-outline" size={16} color={luminousColors.onSurfaceVariant} />
              <Text style={styles.secondaryCodeText}>
                Sudah punya kode pasangan?{' '}
                <Text style={styles.secondaryCodeBold}>Masuk</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Micro Interaction Modal: "Tautkan Hati Kalian" Bottom Sheet */}
        <Modal
          visible={sheetVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSheetVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => setSheetVisible(false)}
              activeOpacity={1}
            />
            <View style={styles.sheetContainer}>
              {/* Sheet Header */}
              <View style={styles.sheetHeaderRow}>
                <View style={styles.sheetTitleGroup}>
                  <Ionicons name="heart" size={20} color={luminousColors.primary} />
                  <Text style={styles.sheetTitle}>Tautkan Hati Kalian</Text>
                </View>
                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setSheetVisible(false)}
                  activeOpacity={0.7}>
                  <Ionicons name="close" size={18} color={luminousColors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <Text style={styles.sheetDesc}>
                Kirimkan kode unik ini kepada pasanganmu atau masukkan kodenya untuk terhubung seketika.
              </Text>

              {/* Display Generated/Assigned Code */}
              <View style={styles.codeCard}>
                <View>
                  <Text style={styles.codeCardLabel}>Kode Unik Kamu</Text>
                  <Text style={styles.codeCardValue}>OURS-8921</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={handleCopyCode}
                  activeOpacity={0.8}>
                  <Ionicons name="copy-outline" size={15} color={luminousColors.onPrimaryFixed} />
                  <Text style={styles.copyBtnText}>
                    {copiedToast ? 'Tersalin!' : 'Salin'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Input Partner Code */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Masukkan Kode Pasangan</Text>
                {pairingError ? (
                  <Text style={styles.errorText}>{pairingError}</Text>
                ) : null}
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. OURS-XXXX"
                    placeholderTextColor="#8F6F71"
                    value={partnerCodeInput}
                    onChangeText={setPartnerCodeInput}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={handleConnectCode}
                    activeOpacity={0.85}>
                    <Text style={styles.connectBtnText}>Tautkan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Fallback for active state if somehow not redirected
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={luminousColors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
    gap: 16,
  },
  brandRowSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#131B2E',
    letterSpacing: 2,
  },

  // ---------------- Screen 01 Root & Ambient ----------------
  screenRoot: {
    flex: 1,
    backgroundColor: '#FAF8FF',
    position: 'relative',
  },
  ambientGlowTopLeft: {
    position: 'absolute',
    top: -48,
    left: -64,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(255, 218, 219, 0.45)', // primary-fixed/40
  },
  ambientGlowRight: {
    position: 'absolute',
    top: 192,
    right: -48,
    width: 288,
    height: 288,
    borderRadius: 144,
    backgroundColor: 'rgba(196, 231, 255, 0.45)', // secondary-fixed/40
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 48,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  // ---------------- Hero Visual Card ----------------
  heroGlassCard: {
    width: '100%',
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    padding: 6,
    shadowColor: '#B90538',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  heroInnerContainer: {
    width: '100%',
    height: 290,
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EAEDFF',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(19, 27, 46, 0.15)',
  },
  connectionPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  pulseContainer: {
    width: 8,
    height: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#B90538',
  },
  solidDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#B90538',
  },
  connectionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B90538',
    letterSpacing: 0.2,
  },
  presencePill: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarK: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFDADB', // primary-fixed
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarKText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#400010',
  },
  avatarD: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#C4E7FF', // secondary-fixed
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  avatarDText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#001E2C',
  },
  presenceHeart: {
    marginLeft: 6,
  },

  // ---------------- Headline Section ----------------
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  kickerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B90538',
    letterSpacing: 1.2,
  },
  mainHeadline: {
    fontSize: 30,
    fontWeight: '800',
    color: '#131B2E',
    textAlign: 'center',
    letterSpacing: -0.6,
    lineHeight: 38,
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 15,
    color: '#5B4041',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },

  // ---------------- Feature Highlight Cards ----------------
  featuresList: {
    gap: 12,
    marginBottom: 28,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#B90538',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    gap: 14,
  },
  iconCircleTertiary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFDADC', // tertiary-fixed
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C4E7FF', // secondary-fixed
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePrimary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFDADB', // primary-fixed
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131B2E',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 13,
    color: '#5B4041',
    lineHeight: 18,
  },

  // ---------------- Actions ----------------
  actionSection: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 9999,
    backgroundColor: '#B90538', // primary
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#B90538',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryCodeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 9999,
    backgroundColor: 'rgba(242, 243, 255, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(218, 226, 253, 0.6)',
  },
  secondaryCodeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5B4041',
  },
  secondaryCodeBold: {
    fontWeight: '700',
    color: '#B90538',
  },

  // ---------------- Modal Bottom Sheet ----------------
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 10,
    gap: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#131B2E',
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDesc: {
    fontSize: 13,
    color: '#5B4041',
    lineHeight: 19,
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F3FF',
    padding: 14,
    borderRadius: 18,
  },
  codeCardLabel: {
    fontSize: 11,
    color: '#5B4041',
    marginBottom: 2,
    fontWeight: '600',
  },
  codeCardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#B90538',
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFDADB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#400010',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B4041',
  },
  errorText: {
    fontSize: 12,
    color: '#BA1A1A',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FAF8FF',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#131B2E',
    borderWidth: 1,
    borderColor: '#E2E7FF',
  },
  connectBtn: {
    backgroundColor: '#B90538',
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
