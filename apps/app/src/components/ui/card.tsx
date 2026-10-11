import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { colors } from '@ours/design-tokens';

interface CardProps extends ViewProps {
  variant?: 'default' | 'subtle' | 'accent';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  ...props
}) => {
  return (
    <View style={[styles.base, styles[variant], style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  default: {
    backgroundColor: colors.surface,
  },
  subtle: {
    backgroundColor: colors.background,
  },
  accent: {
    backgroundColor: colors.softBlue,
    borderColor: '#C7D4F5',
  },
});
