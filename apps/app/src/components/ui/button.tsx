import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '@ours/design-tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const isInteractive = !loading && !disabled;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? '#FFFFFF' : colors.primaryBlue}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.textBase,
              styles[`text_${variant}`],
              styles[`textSize_${size}`],
              textStyle,
            ]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
    minHeight: 44, // WCAG minimum touch target
  },
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 38,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    minHeight: 56,
  },
  primary: {
    backgroundColor: colors.primaryBlue,
  },
  secondary: {
    backgroundColor: colors.softBlue,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  destructive: {
    backgroundColor: colors.error,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 15,
  },
  textSize_lg: {
    fontSize: 17,
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: colors.primaryBlue,
  },
  text_outline: {
    color: colors.textPrimary,
  },
  text_destructive: {
    color: '#FFFFFF',
  },
  text_ghost: {
    color: colors.textSecondary,
  },
});
