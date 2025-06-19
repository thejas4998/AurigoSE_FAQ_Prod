// src/api/authAPI.ts
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5267/api';
/**
 * AXIOS INTERCEPTORS - These run automatically on every request/response
 */

// REQUEST INTERCEPTOR: Adds the JWT token to every outgoing request
// This means you don't have to manually add "Authorization: Bearer token" to each API call
axios.interceptors.request.use(
  (config) => {
    // Get token from browser's localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config; // Continue with the request
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Handles authentication errors globally
// If any API call returns 401 (Unauthorized), user is redirected to login
axios.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      // Clear stored authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * TYPESCRIPT INTERFACES
 */
export interface LoginResponse {
  token: string;           // JWT token for authentication
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * API FUNCTIONS
 */

// Login with email/password - sends credentials to server, receives JWT token
export const loginWithCredentials = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email,
    password
  });
  
  // The server returns { token: "...", user: {...} }
  return response.data;
};

// Initiate Azure AD login (redirects to Microsoft login page)
export const loginWithAzureAD = async () => {
  // This would typically use Microsoft's MSAL library
  // For now, it redirects to your backend which handles the Azure AD flow
  window.location.href = `${API_BASE}/auth/azure-login`;
};

// Logout - clears local storage and redirects to login
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Get current user info from localStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Check if user is authenticated (has a token)
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * HOW IT WORKS WITH YOUR FAQ API:
 * 
 * 1. User logs in via Login.tsx
 * 2. Token is stored in localStorage
 * 3. When you call any faqAPI function (getQuestions, postQuestion, etc.)
 *    the request interceptor automatically adds the token
 * 4. If the token is invalid/expired, the response interceptor redirects to login
 * 
 * Example flow:
 * - User calls getQuestions() from faqAPI.ts
 * - Request interceptor adds "Authorization: Bearer [token]" header
 * - Server validates token
 * - If valid: returns questions
 * - If invalid: returns 401, interceptor redirects to login
 */