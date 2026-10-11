/**
 * CircularCarousel.tsx
 *
 * PROVENANCE:
 * - Component Name: CircularCarousel
 * - Upstream Source: https://reactbits.dev/ (React Bits Carousel Concepts) & https://github.com/mrmuhammadali/react-native-circular-carousel
 * - License: MIT License
 * - Acquisition Method: UPSTREAM_SOURCE_ADAPTED
 * - Original Framework: React Web / Native Gestures
 * - Native Adaptation Details:
 *     Adapted to pure React Native 2D animation with scroll offset interpolation,
 *     spring scale and opacity emphasis for the active card, snap-to-center physics,
 *     and touch responsive cards. Works on iOS, Android, and Web.
 */

import React, { useState } from 'react';
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface CircularCarouselItem {
  id: string;
  [key: string]: any;
}

interface CircularCarouselProps<T extends CircularCarouselItem> {
  data: T[];
  renderItem: (item: T, index: number, isActive: boolean) => React.ReactNode;
  itemWidth?: number;
  itemSpacing?: number;
  containerStyle?: ViewStyle;
  onActiveIndexChange?: (index: number) => void;
}

export function CircularCarousel<T extends CircularCarouselItem>({
  data,
  renderItem,
  itemWidth = 260,
  itemSpacing = 16,
  containerStyle,
  onActiveIndexChange,
}: CircularCarouselProps<T>) {
  const [scrollX] = useState(() => new Animated.Value(0));
  const [activeIndex, setActiveIndex] = useState(0);

  const snapInterval = itemWidth + itemSpacing;
  const sideSpacer = Math.max(0, (SCREEN_WIDTH - itemWidth) / 2 - 20);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const xOffset = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(xOffset / snapInterval);
        if (newIndex >= 0 && newIndex < data.length && newIndex !== activeIndex) {
          setActiveIndex(newIndex);
          onActiveIndexChange?.(newIndex);
        }
      },
    },
  );

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        bounces={false}
        contentContainerStyle={{
          paddingHorizontal: sideSpacer,
          alignItems: 'center',
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}>
        {data.map((item, index) => {
          const inputRange = [
            (index - 1) * snapInterval,
            index * snapInterval,
            (index + 1) * snapInterval,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.88, 1.0, 0.88],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.65, 1.0, 0.65],
            extrapolate: 'clamp',
          });

          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [8, 0, 8],
            extrapolate: 'clamp',
          });

          const isActive = index === activeIndex;

          return (
            <Animated.View
              key={item.id || `carousel-item-${index}`}
              style={[
                styles.itemWrapper,
                {
                  width: itemWidth,
                  marginRight: index === data.length - 1 ? 0 : itemSpacing,
                  transform: [{ scale }, { translateY }],
                  opacity,
                },
              ]}>
              {renderItem(item, index, isActive)}
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      {/* Pagination Dot Indicators */}
      {data.length > 1 && (
        <View style={styles.paginationRow}>
          {data.map((_, i) => (
            <View
              key={`dot-${i}`}
              style={[
                styles.dot,
                i === activeIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  itemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  activeDot: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F43F5E',
  },
});
