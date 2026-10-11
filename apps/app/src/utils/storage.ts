import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memoryStore = new Map<string, string>();

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // In web, never persist raw session tokens in browser localStorage or sessionStorage
      return memoryStore.get(key) ?? null;
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // In web, keep in memory only (HttpOnly session cookie handles persistence securely)
      memoryStore.set(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } catch {
      memoryStore.set(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      memoryStore.delete(key);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

