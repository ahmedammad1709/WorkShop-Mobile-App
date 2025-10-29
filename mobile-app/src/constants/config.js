// API Configuration
// For production, set MOBILE_API_URL in environment or update app.json extra field
import Constants from 'expo-constants';

// Get API URL from environment variable or default to localhost
// This can be set via expo-env or app.json extra field
const getApiBaseUrl = () => {
  // Check if running in Expo Go or standalone
  const extra = Constants.expoConfig?.extra || {};
  
  // Priority: extra.MOBILE_API_URL > process.env.MOBILE_API_URL > default
  let apiUrl = extra.MOBILE_API_URL || process.env.MOBILE_API_URL || 'http://localhost:5000';
  
  // Normalize: remove trailing slashes
  apiUrl = apiUrl.replace(/\/+$/, '');
  // If it includes trailing "/api", strip it to keep base clean
  apiUrl = apiUrl.replace(/\/api$/, '');
  
  return apiUrl;
};

export const API_BASE_URL = getApiBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;

// Storage keys
export const STORAGE_KEYS = {
  USER_EMAIL: 'userEmail',
  USER_ROLE: 'userRole',
  CONTRACTOR_NOTIFICATIONS: 'contractorNotifications',
};

// Colors matching the web app theme
export const COLORS = {
  primary: '#29cc6a', // green-600
  primaryDark: '#22c55e', // green-700
  primaryLight: '#dcfce7', // green-100
  background: '#f3f4f6', // gray-100
  white: '#ffffff',
  text: '#111827', // gray-900
  textSecondary: '#6b7280', // gray-500
  textLight: '#9ca3af', // gray-400
  border: '#e5e7eb', // gray-200
  error: '#ef4444', // red-500
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
};

