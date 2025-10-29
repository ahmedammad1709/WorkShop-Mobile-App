// API utility functions
// Wraps fetch calls with base URL handling and error management
import { API_URL } from '../constants/config';

/**
 * Build full API endpoint URL
 * Handles both /api/... and full URLs
 */
const buildUrl = (endpoint) => {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  // Remove leading /api if present (already in API_URL)
  const cleanEndpoint = endpoint.startsWith('/api/') 
    ? endpoint.replace(/^\/api/, '') 
    : endpoint.startsWith('/') 
    ? endpoint 
    : `/${endpoint}`;
  
  return `${API_URL}${cleanEndpoint}`;
};

/**
 * Standard fetch wrapper with error handling
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildUrl(endpoint);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    // Check content type
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    let data = null;
    if (isJson) {
      data = await response.json();
    } else {
      const text = await response.text();
      // Try to parse as JSON if possible
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: response.ok, message: text || 'Unknown error' };
      }
    }

    // Return response data with status
    return {
      ok: response.ok,
      status: response.status,
      data,
      response,
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      ok: false,
      status: 0,
      data: { success: false, message: error.message || 'Network error' },
      error,
    };
  }
};

/**
 * GET request
 */
export const apiGet = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'GET' });
};

/**
 * POST request
 */
export const apiPost = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT request
 */
export const apiPut = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request
 */
export const apiDelete = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
};

/**
 * Auth API calls (matching web app patterns)
 */
export const authAPI = {
  login: async (email, password, role) => {
    const { ok, data } = await apiPost('/auth/login', { email, password, role });
    return { ok, data };
  },

  requestOTP: async (name, email, password, role) => {
    const { ok, data } = await apiPost('/auth/request-otp', { name, email, password, role });
    return { ok, data };
  },

  verifyOTP: async (email, otp) => {
    const { ok, data } = await apiPost('/auth/verify-otp', { email, otp });
    return { ok, data };
  },

  resendOTP: async (email) => {
    const { ok, data } = await apiPost('/auth/resend-otp', { email });
    return { ok, data };
  },

  requestPasswordReset: async (email) => {
    const { ok, data } = await apiPost('/auth/request-password-reset', { email });
    return { ok, data };
  },

  verifyPasswordResetOTP: async (email, otp) => {
    const { ok, data } = await apiPost('/auth/verify-password-reset-otp', { email, otp });
    return { ok, data };
  },

  resetPassword: async (email, otp, newPassword) => {
    const { ok, data } = await apiPost('/auth/reset-password', { email, otp, newPassword });
    return { ok, data };
  },

  getUser: async (email) => {
    const encodedEmail = encodeURIComponent(email);
    const { ok, data } = await apiGet(`/auth/user/${encodedEmail}`);
    return { ok, data };
  },
};

