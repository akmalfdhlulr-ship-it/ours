import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@ours/design-tokens';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Ionicons } from '@expo/vector-icons';

export default function PairingHubScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {/* Stitch Romantic Envelope & Botanical Illustration Hero */}
      <View style={styles.illustrationHero}>
        <View style={styles.ambientGlowPeach} />
        <View style={styles.ambientGlowSage} />
        <View style={styles.envelopeCard}>
          <View style={styles.envelopeFlap} />
          <View style={styles.waxSeal}>
            <Ionicons name="heart" size={18} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Editorial Heading */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>RUANG PASANGAN EKSKLUSIF</Text>
        <Text style={styles.editorialTitle}>
          Satu Langkah Lagi{'\n'}Menuju Ruang Kita
        </Text>
        <Text style={styles.subtitle}>
          Hubungkan hatimu dengan pasangan dalam satu ruang privat yang hangat dan eksklusif.
        </Text>
      </View>

      {/* Action Cards Container */}
      <View style={styles.optionsContainer}>
        {/* Create Space Card */}
        <View style={styles.stitchCard}>
          <View style={styles.cardIconBoxPrimary}>
            <Ionicons name="sparkles" size={20} color="#3657D6" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.optionTitle}>Mulai Ruang Baru</Text>
            <Text style={styles.optionDescription}>
              Buat ruang privat baru dan undang pasanganmu dengan kode unik atau tautan instan.
            </Text>
            <TouchableOpacity
              style={styles.primaryPillBtn}
              activeOpacity={0.88}
              onPress={() => router.push('/(pairing)/create')}>
              <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.primaryPillBtnText}>Buat Ruang Pasangan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Join Space Card */}
        <View style={styles.stitchCard}>
          <View style={styles.cardIconBoxSecondary}>
            <Ionicons name="key-outline" size={20} color="#2D5B37" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.optionTitle}>Gabung dengan Kode</Text>
            <Text style={styles.optionDescription}>
              Menerima kode 6-digit atau tautan undangan dari pasanganmu? Masuk bersama sekarang.
            </Text>
            <TouchableOpacity
              style={styles.secondaryPillBtn}
              activeOpacity={0.88}
              onPress={() => router.push('/(pairing)/join')}>
              <Ionicons name="link-outline" size={16} color="#202522" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryPillBtnText}>Masukkan Kode Undangan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Archived Space Option */}
        <View style={styles.archivedCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.archivedTitle}>Ruang Masa Lalu</Text>
            <Text style={styles.archivedDescription}>
              Lihat arsip baca-saja dari ruang pasangan Anda sebelumnya.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.archivePillBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(pairing)/archived')}>
            <Text style={styles.archivePillBtnText}>Lihat Arsip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer Logout */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}>
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 32 : 54,
    paddingBottom: 40,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#F8F9F7',
  },
  illustrationHero: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  ambientGlowPeach: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#F4E4DA',
    opacity: 0.6,
  },
  ambientGlowSage: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D8E8DA',
    opacity: 0.65,
    transform: [{ translateX: -20 }, { translateY: -10 }],
  },
  envelopeCard: {
    width: 110,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECEFEA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#202522',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    transform: [{ rotate: '-3deg' }],
  },
  envelopeFlap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 35,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFEA',
    backgroundColor: '#FAFBF9',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  waxSeal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E35555',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#E35555',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#69746D',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  editorialTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '400',
    color: '#202522',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#69746D',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  optionsContainer: {
    gap: 14,
  },
  stitchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ECEFEA',
    padding: 18,
    shadowColor: '#202522',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardIconBoxPrimary: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6EBFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconBoxSecondary: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#D8E8DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: {
    gap: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202522',
  },
  optionDescription: {
    fontSize: 13,
    color: '#69746D',
    lineHeight: 18,
    marginBottom: 12,
  },
  primaryPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3657D6',
    borderRadius: 14,
    paddingVertical: 12,
    shadowColor: '#3657D6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryPillBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEFEA',
    borderRadius: 14,
    paddingVertical: 12,
  },
  secondaryPillBtnText: {
    color: '#202522',
    fontSize: 14,
    fontWeight: '700',
  },
  archivedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3EE',
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
  },
  archivedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#202522',
  },
  archivedDescription: {
    fontSize: 11,
    color: '#69746D',
    marginTop: 2,
  },
  archivePillBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEFEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 10,
  },
  archivePillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#202522',
  },
  footerRow: {
    marginTop: 28,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});
