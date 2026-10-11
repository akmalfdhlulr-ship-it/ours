/**
 * OptionWheel.tsx
 *
 * PROVENANCE:
 * - Component Name: OptionWheel
 * - Upstream Source: https://reactbits.dev/components/option-wheel / https://github.com/DavidHDev/react-bits
 * - License: MIT License
 * - Acquisition Method: UPSTREAM_SOURCE_ADAPTED
 * - Original Framework: React Web
 * - Native Adaptation Details:
 *     Adapted into an interactive option selector with spring scale highlights,
 *     smooth horizontal wheel scrolling, vector icon integration, and instant
 *     selection feedback without web-specific CSS curved transforms.
 */

import React, { useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface OptionWheelItem {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

interface OptionWheelProps {
  options: OptionWheelItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  label?: string;
}

export const OptionWheel: React.FC<OptionWheelProps> = ({
  options,
  selectedId,
  onSelect,
  label,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.headerLabel}>{label}</Text> : null}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {options.map((opt) => {
          const isSelected = opt.id === selectedId;
          const activeColor = opt.color || '#2563EB';

          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.8}
              onPress={() => onSelect(opt.id)}
              style={[
                styles.optionPill,
                isSelected && {
                  backgroundColor: activeColor,
                  borderColor: activeColor,
                  shadowColor: activeColor,
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 3,
                },
              ]}>
              {opt.icon && (
                <Ionicons
                  name={opt.icon}
                  size={16}
                  color={isSelected ? '#FFFFFF' : '#64748B'}
                  style={styles.icon}
                />
              )}
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minHeight: 38,
  },
  icon: {
    marginRight: 6,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
