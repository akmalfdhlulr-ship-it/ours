import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '@ours/design-tokens';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
}) => {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: colors.softBlue,
  },
  success: {
    backgroundColor: colors.functional.successBackground,
  },
  warning: {
    backgroundColor: colors.functional.warningBackground,
  },
  neutral: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text_primary: {
    color: colors.primaryBlue,
  },
  text_success: {
    color: colors.functional.success,
  },
  text_warning: {
    color: colors.functional.warning,
  },
  text_neutral: {
    color: colors.textSecondary,
  },
});
