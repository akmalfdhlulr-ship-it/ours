/**
 * PaperCrumpleCard.tsx
 *
 * PROVENANCE:
 * - Component Name: PaperCrumpleCard
 * - Upstream Source: https://reactbits.dev/components/paper-crumple (React Bits PaperCrumple Concept)
 * - License: MIT License
 * - Acquisition Method: CUSTOM_NATIVE_ADAPTATION
 * - Original Framework: React Web with WebGL / Three.js
 * - Native Adaptation Details:
 *     Upstream WebGL/Three.js replaced completely with lightweight 2D React Native transforms:
 *     Animated spring paper unfold effect, wax seal tap-to-reveal interaction,
 *     warm letter paper styling (#FFFDF7 with subtle warm borders), and zero WebGL memory leaks.
 */

import React, { useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PaperCrumpleCardProps {
  title: string;
  subtitle?: string;
  content: string;
  senderName?: string;
  senderBadge?: string;
  statusText?: string;
  date?: string;
  isSealedInitially?: boolean;
  onOpen?: () => void;
  onReply?: () => void;
}

export const PaperCrumpleCard: React.FC<PaperCrumpleCardProps> = ({
  title,
  subtitle,
  content,
  senderName,
  senderBadge,
  statusText,
  date,
  isSealedInitially = true,
  onOpen,
  onReply,
}) => {
  const [isOpened, setIsOpened] = useState(!isSealedInitially);
  const [unfoldAnim] = useState(() => new Animated.Value(isSealedInitially ? 0 : 1));

  const handleToggle = () => {
    const nextState = !isOpened;
    setIsOpened(nextState);
    if (nextState && onOpen) {
      onOpen();
    }
    Animated.spring(unfoldAnim, {
      toValue: nextState ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const scale = unfoldAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.0],
  });

  const rotate = unfoldAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-1.5deg', '0deg'],
  });

  return (
    <Animated.View
      style={[
        styles.paperCard,
        {
          transform: [{ scale }, { rotate }],
        },
      ]}>
      {/* Letter Header */}
      <View style={styles.headerRow}>
        <View style={styles.stampBadge}>
          <Ionicons name="mail" size={16} color="#B91C1C" />
          <Text style={styles.stampText}>{senderBadge || 'SURAT CINTA'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {date ? <Text style={styles.dateText}>{date}</Text> : null}
          {statusText ? (
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#B91C1C', marginTop: 2 }}>
              {statusText}
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {/* Sealed State Preview or Unfolded Letter Content */}
      {!isOpened ? (
        <TouchableOpacity
          style={styles.waxSealContainer}
          activeOpacity={0.85}
          onPress={handleToggle}>
          <View style={styles.waxSeal}>
            <Ionicons name="heart" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.sealHintText}>Ketuk segel untuk membuka surat</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.contentContainer}>
          <View style={styles.ruledLine} />
          <Text style={styles.letterContent}>{content}</Text>
          <View style={styles.ruledLine} />
          {senderName ? (
            <View style={styles.signatureRow}>
              <Text style={styles.signatureLabel}>Dengan cinta,</Text>
              <Text style={styles.signatureName}>{senderName}</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 14 }}>
            {onReply && (
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: '#F43F5E', borderColor: '#F43F5E' }]}
                onPress={onReply}
                activeOpacity={0.85}>
                <Ionicons name="heart" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={[styles.closeButtonText, { color: '#FFFFFF' }]}>Balas Surat</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleToggle}
              activeOpacity={0.7}>
              <Text style={styles.closeButtonText}>Lipat Kembali</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  paperCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFE8DE',
    padding: 20,
    marginVertical: 10,
    width: '100%',
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stampBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#EF4444',
  },
  stampText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  waxSealContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  waxSeal: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  sealHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E11D48',
  },
  contentContainer: {
    gap: 12,
    marginTop: 6,
  },
  ruledLine: {
    height: 1,
    backgroundColor: '#F1E9DE',
  },
  letterContent: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  signatureRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  signatureLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  signatureName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  closeButton: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
