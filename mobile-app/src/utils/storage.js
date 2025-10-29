// AsyncStorage wrapper utility
// This replaces localStorage from the web app
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';

export const storage = {
  // Get item (string)
  async getItem(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading storage key "${key}":`, error);
      return null;
    }
  },

  // Set item (string)
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, String(value));
      return true;
    } catch (error) {
      console.error(`Error writing storage key "${key}":`, error);
      return false;
    }
  },

  // Remove item
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing storage key "${key}":`, error);
      return false;
    }
  },

  // Get JSON object
  async getJSON(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error reading JSON from storage key "${key}":`, error);
      return null;
    }
  },

  // Set JSON object
  async setJSON(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing JSON to storage key "${key}":`, error);
      return false;
    }
  },

  // Clear all storage
  async clear() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },
};

// Convenience methods for common storage operations
export const getUserEmail = () => storage.getItem(STORAGE_KEYS.USER_EMAIL);
export const setUserEmail = (email) => storage.setItem(STORAGE_KEYS.USER_EMAIL, email);
export const getUserRole = () => storage.getItem(STORAGE_KEYS.USER_ROLE);
export const setUserRole = (role) => storage.setItem(STORAGE_KEYS.USER_ROLE, role);
export const clearUserData = async () => {
  await storage.removeItem(STORAGE_KEYS.USER_EMAIL);
  await storage.removeItem(STORAGE_KEYS.USER_ROLE);
};
export const getContractorNotifications = () => storage.getJSON(STORAGE_KEYS.CONTRACTOR_NOTIFICATIONS);
export const setContractorNotifications = (notifications) => storage.setJSON(STORAGE_KEYS.CONTRACTOR_NOTIFICATIONS, notifications);

