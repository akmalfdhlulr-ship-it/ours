/**
 * DriftWall.tsx
 *
 * PROVENANCE:
 * - Component Name: DriftWall
 * - Upstream Source: https://reactbits.dev/components/drift-wall / https://github.com/DavidHDev/react-bits
 * - License: MIT License
 * - Acquisition Method: UPSTREAM_SOURCE_ADAPTED
 * - Original Framework: React Web
 * - Native Adaptation Details:
 *     Adapted into an editorial React Native photo wall with staggered fade-in,
 *     natural masonry rhythm (alternating column offsets), touch scale feedback,
 *     and zero perpetual browser rendering loops to ensure light mobile performance.
 */

import React, { useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface DriftWallItem {
  id: string;
  url: string;
  title?: string;
  caption?: string;
  date?: string;
  heightRatio?: number; // e.g. 1.2 for tall, 0.9 for wide
}

interface DriftWallProps {
  items: DriftWallItem[];
  onItemPress?: (item: DriftWallItem) => void;
  emptyText?: string;
}

interface DriftWallCardProps {
  item: DriftWallItem;
  columnWidth: number;
  delay: number;
  onPress?: (item: DriftWallItem) => void;
}

const DriftWallCard: React.FC<DriftWallCardProps> = ({
  item,
  columnWidth,
  delay,
  onPress,
}) => {
  const [anim] = React.useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay: Math.min(delay, 600),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const cardHeight = Math.round(columnWidth * (item.heightRatio || 1.15));

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          width: columnWidth,
          height: cardHeight,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        },
      ]}>
      <TouchableOpacity
        activeOpacity={0.88}
        style={StyleSheet.absoluteFill}
        onPress={() => onPress?.(item)}>
        <Image
          source={{ uri: item.url }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardOverlay}>
          {item.title ? (
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
          ) : null}
          {item.date ? (
            <Text style={styles.cardDate}>{item.date}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const DriftWall: React.FC<DriftWallProps> = ({
  items,
  onItemPress,
  emptyText = 'Belum ada foto kenangan dalam galeri.',
}) => {
  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  // Split items into 2 masonry columns
  const column1 = items.filter((_, idx) => idx % 2 === 0);
  const column2 = items.filter((_, idx) => idx % 2 === 1);
  const columnWidth = (SCREEN_WIDTH - 40 - 12) / 2;

  return (
    <View style={styles.wallContainer}>
      {/* Column 1 */}
      <View style={[styles.column, { width: columnWidth }]}>
        {column1.map((item, idx) => (
          <DriftWallCard
            key={item.id}
            item={item}
            columnWidth={columnWidth}
            delay={idx * 2 * 60}
            onPress={onItemPress}
          />
        ))}
      </View>

      {/* Column 2 (Offset by 16px for staggered editorial masonry) */}
      <View style={[styles.column, styles.columnOffset, { width: columnWidth }]}>
        {column2.map((item, idx) => (
          <DriftWallCard
            key={item.id}
            item={item}
            columnWidth={columnWidth}
            delay={(idx * 2 + 1) * 60}
            onPress={onItemPress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wallContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
  },
  column: {
    gap: 12,
  },
  columnOffset: {
    paddingTop: 16,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cardDate: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});
