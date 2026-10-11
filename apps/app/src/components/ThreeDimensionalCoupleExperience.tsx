import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, spacing } from '@ours/design-tokens';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  milestoneTitle?: string;
  daysTogether?: number;
  onExploreMilestone?: () => void;
}

export function ThreeDimensionalCoupleExperience({
  milestoneTitle = '100 Hari Bersama',
  daysTogether = 124,
  onExploreMilestone,
}: Props) {
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [pulseAnim]);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" size={18} color={colors.primaryBlue} />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.titleText}>{milestoneTitle}</Text>
          <Text style={styles.subtitleText}>Momen spesial perjalanan cinta kita</Text>
        </View>
        <Animated.View style={[styles.daysBadge, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="heart" size={14} color={colors.romanticPink || '#F43F5E'} />
          <Text style={styles.daysText}>{daysTogether} Hari</Text>
        </Animated.View>
      </View>

      <View style={styles.milestoneVisualRow}>
        <View style={styles.visualRingContainer}>
          <View style={styles.outerRing}>
            <View style={styles.innerRing}>
              <Ionicons name="heart" size={24} color={colors.romanticPink || '#F43F5E'} />
            </View>
          </View>
        </View>

        <View style={styles.statsColumn}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Status Hubungan</Text>
            <Text style={styles.statValue}>Sangat Harmonis</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Target Berikutnya</Text>
            <Text style={styles.statValue}>Anniversary 1 Tahun</Text>
          </View>
        </View>
      </View>

      {onExploreMilestone && (
        <TouchableOpacity
          onPress={onExploreMilestone}
          style={styles.actionButton}
          activeOpacity={0.85}>
          <Text style={styles.actionButtonText}>Buka Cerita Kenangan</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primaryBlue} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: '#E6EAE5',
    shadowColor: '#202522',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginVertical: spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  titleWrapper: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitleText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 4,
  },
  daysText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F43F5E',
  },
  milestoneVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: spacing[3],
    marginVertical: spacing[2],
  },
  visualRingContainer: {
    marginRight: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  innerRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  statItem: {
    paddingVertical: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  statDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2] + 2,
    borderRadius: 12,
    backgroundColor: '#F0F5FF',
    marginTop: spacing[2],
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryBlue,
  },
});
