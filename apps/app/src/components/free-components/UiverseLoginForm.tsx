/**
 * UiverseLoginForm.tsx
 *
 * PROVENANCE:
 * - Component Name: UiverseLoginForm
 * - Upstream Source: https://uiverse.io/ (Uiverse Free Form Elements)
 * - License: MIT / Open Source Free
 * - Acquisition Method: UPSTREAM_SOURCE_ADAPTED
 * - Original Framework: HTML5/CSS3 (Web)
 * - Native Adaptation Details:
 *     Adapted into React Native with Animated focus border highlights,
 *     integrated vector Ionicons, password secure-entry toggle,
 *     accessible touch targets (min 44pt), natural Bahasa Indonesia labels,
 *     and zero Web-only CSS/DOM dependencies.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UiverseLoginFormProps {
  onSubmit: (email: string, pass: string, rememberMe: boolean) => Promise<void>;
  onForgotPassword: () => void;
  onRegisterPress: () => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const UiverseLoginForm: React.FC<UiverseLoginFormProps> = ({
  onSubmit,
  onForgotPassword,
  onRegisterPress,
  isLoading = false,
  errorMessage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Animated focus transitions (useState compliant with React 19)
  const [emailFocusAnim] = useState(() => new Animated.Value(0));
  const [passwordFocusAnim] = useState(() => new Animated.Value(0));

  const handleFocus = (field: 'email' | 'password') => {
    if (field === 'email') {
      setIsEmailFocused(true);
      Animated.timing(emailFocusAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      setIsPasswordFocused(true);
      Animated.timing(passwordFocusAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleBlur = (field: 'email' | 'password') => {
    if (field === 'email') {
      setIsEmailFocused(false);
      Animated.timing(emailFocusAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      setIsPasswordFocused(false);
      Animated.timing(passwordFocusAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const emailBorderColor = emailFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E2E8F0', '#2563EB'],
  });

  const passwordBorderColor = passwordFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E2E8F0', '#2563EB'],
  });

  const handleSubmit = () => {
    if (isLoading) return;
    onSubmit(email.trim(), password, rememberMe);
  };

  return (
    <View style={styles.formContainer}>
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Email Input Field with Icon */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Alamat Email</Text>
        <Animated.View
          style={[
            styles.inputBox,
            { borderColor: emailBorderColor },
            isEmailFocused && styles.inputBoxFocused,
          ]}>
          <Ionicons
            name="mail-outline"
            size={20}
            color={isEmailFocused ? '#2563EB' : '#94A3B8'}
            style={styles.leadingIcon}
          />
          <TextInput
            style={styles.textInput}
            placeholder="nama@email.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
            editable={!isLoading}
          />
          {email.length > 0 && (
            <TouchableOpacity
              onPress={() => setEmail('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>

      {/* Password Input Field with Visibility Toggle */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Kata Sandi</Text>
        <Animated.View
          style={[
            styles.inputBox,
            { borderColor: passwordBorderColor },
            isPasswordFocused && styles.inputBoxFocused,
          ]}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={isPasswordFocused ? '#2563EB' : '#94A3B8'}
            style={styles.leadingIcon}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Masukkan kata sandi akun"
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
            onFocus={() => handleFocus('password')}
            onBlur={() => handleBlur('password')}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#64748B"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Remember Me and Forgot Password Row */}
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={styles.rememberMeTouchable}
          activeOpacity={0.8}
          onPress={() => setRememberMe(!rememberMe)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
            {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.rememberMeLabel}>Ingat saya</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onForgotPassword} activeOpacity={0.7}>
          <Text style={styles.forgotPasswordText}>Lupa kata sandi?</Text>
        </TouchableOpacity>
      </View>

      {/* Submit Action Button */}
      <TouchableOpacity
        style={[styles.submitButton, (!email || !password || isLoading) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading || !email.trim() || !password}
        activeOpacity={0.85}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={styles.buttonInnerRow}>
            <Text style={styles.submitButtonText}>Masuk ke OURS</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      {/* Registration Navigation Footer */}
      <View style={styles.registerPromptRow}>
        <Text style={styles.registerPromptText}>Belum memiliki ruang pasangan? </Text>
        <TouchableOpacity onPress={onRegisterPress} activeOpacity={0.7}>
          <Text style={styles.registerPromptLink}>Daftar bersama</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  fieldWrapper: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputBoxFocused: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  leadingIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rememberMeTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 32,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  rememberMeLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  registerPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
  },
  registerPromptText: {
    fontSize: 14,
    color: '#64748B',
  },
  registerPromptLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F43F5E',
  },
});
