import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing } from '@ours/design-tokens';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ionicons } from '@expo/vector-icons';

const ONBOARDING_HERO_IMAGE =
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80';

export default function HomeScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ token?: string }>();
  const { user, coupleSpace, lifecycleState, isLoading, logout } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);

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

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.brandRowSimple}>
          <Ionicons name="heart" size={24} color={colors.romanticPink || '#F43F5E'} />
          <Text style={styles.brandTitle}>OURS</Text>
        </View>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

  const slides = [
    {
      badge: 'APLIKASI RUANG PASANGAN',
      titlePrimary: 'Selamat datang di',
      titleBrand: 'OURS',
      description:
        'Tempat untuk merencanakan, menjelajah, menyimpan kenangan, dan tumbuh bersama.',
      image:
        'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1000&q=85',
    },
    {
      badge: 'KENCAN & JELAJAH',
      titlePrimary: 'Temukan Spot Kencan',
      titleBrand: 'Romantis',
      description:
        'Ratusan kurasi kafe, restoran, dan aktivitas seru untuk kencan tak terlupakan.',
      image:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85',
    },
    {
      badge: 'KENANGAN & SCRAPBOOK',
      titlePrimary: 'Simpan Setiap Momen',
      titleBrand: 'Abadi',
      description:
        'Kolase foto polaroid, tiket memori, dan rekaman suara cinta kalian berdua.',
      image:
        'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1000&q=85',
    },
  ];

  const currentSlide = slides[activeSlide];

  // If unauthenticated, show Screen 01: Onboarding
  if (lifecycleState === 'UNAUTHENTICATED') {
    return (
      <View style={styles.onboardingScreenRoot}>
        <ScrollView
          contentContainerStyle={styles.onboardingScrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Top Hero Photo Section with Curve & Badges */}
          <View style={styles.heroSectionWrapper}>
            <Image
              source={{ uri: currentSlide.image }}
              style={styles.heroPhotoImg}
              resizeMode="cover"
            />
            {/* Soft Gradient Overlay */}
            <View style={styles.heroGradientOverlayTop} />

            {/* Top Right Floating Badge: #CeritaKita */}
            <View style={styles.topRightBadge}>
              <Ionicons name="heart" size={13} color="#F43F5E" />
              <Text style={styles.topRightBadgeText}>#CeritaKita</Text>
            </View>

            {/* Bottom Left Floating Card: Ruang Berdua Tumbuh Bersama */}
            <View style={styles.bottomLeftFloatCard}>
              <View style={styles.bottomLeftIconCircle}>
                <Ionicons name="heart" size={16} color="#F43F5E" />
              </View>
              <View>
                <Text style={styles.bottomLeftSmallLabel}>Ruang Berdua</Text>
                <Text style={styles.bottomLeftBoldLabel}>Tumbuh Bersama</Text>
              </View>
            </View>
          </View>

          {/* Bottom Content Area */}
          <View style={styles.bottomOnboardingContent}>
            {/* Pill Badge */}
            <View style={styles.pillBadgeWrapper}>
              <Ionicons name="heart" size={12} color="#E11D48" />
              <Text style={styles.pillBadgeText}>{currentSlide.badge}</Text>
            </View>

            {/* Headline */}
            <Text style={styles.headlinePrimaryText}>{currentSlide.titlePrimary}</Text>
            <Text style={styles.headlineBrandText}>{currentSlide.titleBrand}</Text>

            {/* Description Subtitle */}
            <Text style={styles.subtitleDescText}>{currentSlide.description}</Text>

            {/* Carousel Pagination Dots */}
            <View style={styles.carouselDotsRow}>
              {slides.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setActiveSlide(idx)}
                  activeOpacity={0.8}
                  style={[
                    styles.dotItem,
                    activeSlide === idx ? styles.dotItemActive : styles.dotItemInactive,
                  ]}
                />
              ))}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.btnMulaiBersama}
              onPress={() => {
                if (activeSlide < slides.length - 1) {
                  setActiveSlide(activeSlide + 1);
                } else {
                  router.push('/(auth)/register');
                }
              }}
              activeOpacity={0.88}>
              <Text style={styles.btnMulaiBersamaText}>Mulai Bersama</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.sudahPunyaAkunRow}>
              <Text style={styles.sudahPunyaAkunText}>Sudah punya akun? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
                <Text style={styles.masukLinkText}>Masuk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (lifecycleState !== 'VERIFIED_WITH_ACTIVE_SPACE') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

  // Calculate days together if anniversary or space creation exists
  let daysTogether: number | null = null;
  const referenceDateStr =
    coupleSpace?.anniversaryDate || coupleSpace?.createdAt;
  if (referenceDateStr) {
    const refDate = new Date(referenceDateStr);
    const diffTime = Math.abs(Date.now() - refDate.getTime());
    daysTogether = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const otherMember = coupleSpace?.members?.find((m) => m.userId !== user?.id);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="heart" size={20} color={colors.romanticPink || '#F43F5E'} />
            <Text style={styles.brandTitle}>OURS</Text>
          </View>
          <Badge label="Ruang Aktif" variant="success" />
        </View>
        <Text style={styles.spaceTitle}>
          {coupleSpace?.name || 'Ruang Bersama'}
        </Text>
        <Text style={styles.partnerSubtitle}>
          Terhubung dengan {otherMember?.displayName || 'pasangan Anda'}
        </Text>
      </View>

      <Card variant="accent" style={styles.milestoneCard}>
        <Text style={styles.milestoneLabel}>Perjalanan Hubungan</Text>
        <Text style={styles.daysCount}>
          {daysTogether !== null ? `${daysTogether} Hari` : 'Bersama'}
        </Text>
        {coupleSpace?.anniversaryDate ? (
          <Text style={styles.anniversaryText}>
            Anniversary: {coupleSpace.anniversaryDate}
          </Text>
        ) : (
          <Text style={styles.anniversaryText}>
            Bersama sejak{' '}
            {coupleSpace?.createdAt ? new Date(coupleSpace.createdAt).toLocaleDateString() : ''}
          </Text>
        )}
      </Card>

      <Card style={styles.membersCard}>
        <Text style={styles.cardSectionTitle}>Anggota Ruang</Text>
        <View style={styles.membersList}>
          {coupleSpace?.members?.map((member) => (
            <View key={member.id} style={styles.memberItem}>
              <View style={styles.memberAvatar}>
                <Text style={styles.avatarLetter}>
                  {(member.displayName || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>
                  {member.displayName}{' '}
                  {member.userId === user?.id ? '(Anda)' : ''}
                </Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.actionsContainer}>
        <Button
          title="Buka Dasbor Aplikasi"
          variant="primary"
          onPress={() => router.replace('/(tabs)' as any)}
        />
        <Button
          title="Pengaturan Ruang Pasangan"
          variant="outline"
          onPress={() => router.push('/(pairing)/settings')}
        />
        <Button
          title="Keluar Akun"
          variant="ghost"
          size="sm"
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
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
    color: '#1F2937',
    letterSpacing: 2,
  },
  // Onboarding Screen Styles
  onboardingScreenRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  onboardingScrollContent: {
    flexGrow: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
  },
  heroSectionWrapper: {
    position: 'relative',
    width: '100%',
    height: 440,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  heroPhotoImg: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  topRightBadge: {
    position: 'absolute',
    top: 24,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topRightBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  bottomLeftFloatCard: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  bottomLeftIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomLeftSmallLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  bottomLeftBoldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  bottomOnboardingContent: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pillBadgeWrapper: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E11D48',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headlinePrimaryText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headlineBrandText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#BE123C',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: 2,
    marginBottom: 8,
  },
  subtitleDescText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  carouselDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dotItem: {
    height: 6,
    borderRadius: 3,
  },
  dotItemActive: {
    width: 28,
    backgroundColor: '#2563EB',
  },
  dotItemInactive: {
    width: 8,
    backgroundColor: '#E5E7EB',
  },
  btnMulaiBersama: {
    width: '100%',
    height: 54,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  btnMulaiBersamaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  sudahPunyaAkunRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  sudahPunyaAkunText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  masukLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  // Active Space Dashboard Styles
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    gap: 20,
    paddingBottom: 110,
  },
  header: {
    gap: 6,
    marginTop: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spaceTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  partnerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  milestoneCard: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6EAE5',
  },
  milestoneLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.primaryBlue,
  },
  daysCount: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  anniversaryText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  membersCard: {
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6EAE5',
  },
  cardSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  memberDetails: {
    gap: 2,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  memberRole: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
    alignItems: 'center',
  },
});
