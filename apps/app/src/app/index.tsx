import React, { useEffect } from 'react';
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

  // If unauthenticated, show Screen 01: Onboarding
  if (lifecycleState === 'UNAUTHENTICATED') {
    return (
      <ScrollView
        contentContainerStyle={styles.onboardingContainer}
        showsVerticalScrollIndicator={false}>
        {/* Top Header Wordmark */}
        <View style={styles.onboardingHeader}>
          <View style={styles.logoBadgeRow}>
            <Ionicons name="heart" size={20} color={colors.romanticPink || '#F43F5E'} />
            <Text style={styles.brandTitle}>OURS</Text>
          </View>
          <Text style={styles.onboardingTagline}>Untuk setiap langkah kita, bersama.</Text>
        </View>

        {/* Hero Photo Card */}
        <View style={styles.heroImageCard}>
          <Image
            source={{ uri: ONBOARDING_HERO_IMAGE }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroGradientOverlay} />
          <View style={styles.heroBadgeFloating}>
            <Text style={styles.heroBadgeText}>More Dates, Brighter Days</Text>
          </View>
        </View>

        {/* Copywriting & Actions */}
        <View style={styles.onboardingContent}>
          <Text style={styles.onboardingHeadline}>Selamat datang di OURS</Text>
          <Text style={styles.onboardingDescription}>
            Tempat untuk merencanakan kencan, menjelajah tempat seru, menyimpan kenangan indah, dan tumbuh bersama.
          </Text>

          <TouchableOpacity
            style={styles.primaryPillButton}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.88}>
            <Text style={styles.primaryPillButtonText}>Mulai Bersama</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryTextButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.7}>
            <Text style={styles.secondaryTextButtonNormal}>
              Sudah punya akun?{' '}
              <Text style={styles.secondaryTextButtonHighlight}>Masuk</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  onboardingContainer: {
    flexGrow: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  onboardingHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onboardingTagline: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  heroImageCard: {
    width: '100%',
    height: 380,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
    shadowColor: '#202522',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  heroBadgeFloating: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F43F5E',
    letterSpacing: 0.5,
  },
  onboardingContent: {
    marginTop: 24,
    alignItems: 'center',
  },
  onboardingHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  onboardingDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  primaryPillButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryPillButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryTextButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  secondaryTextButtonNormal: {
    fontSize: 14,
    color: '#6B7280',
  },
  secondaryTextButtonHighlight: {
    fontWeight: '700',
    color: colors.primaryBlue,
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
