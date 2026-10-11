import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { colors } from '@ours/design-tokens';

interface CodeBoxProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  disabled?: boolean;
}

export const CodeBox: React.FC<CodeBoxProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
}) => {
  const inputRef = useRef<TextInput>(null);

  const cleanVal = value.toUpperCase().slice(0, length);
  const chars = Array.from({ length }).map((_, i) => cleanVal[i] || '');

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={styles.container}>
      <View style={styles.boxesRow}>
        {chars.map((char, index) => {
          const isCurrent = index === cleanVal.length;
          const isFilled = Boolean(char);

          return (
            <View
              key={index}
              style={[
                styles.box,
                isCurrent && styles.boxActive,
                isFilled && styles.boxFilled,
              ]}>
              <Text style={styles.charText}>{char}</Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={cleanVal}
        onChangeText={(text) => onChange(text.toUpperCase().slice(0, length))}
        maxLength={length}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!disabled}
        style={styles.hiddenInput}
        accessibilityLabel={`Enter ${length} character code`}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  boxesRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  box: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: '#FAFBFD',
  },
  boxFilled: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  charText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0.01,
    width: '100%',
    height: '100%',
  },
});
