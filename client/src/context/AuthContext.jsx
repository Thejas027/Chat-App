import { createContext, useContext, useReducer, useEffect } from 'react';
import { authToasts, handleApiError } from '../utils/toast';

// Auth Context
const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already authenticated on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include' // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        // Store token for socket connection
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
        authToasts.registerSuccess(data.user.fullName);
        return { success: true, message: data.message };
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: data.message });
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((error, index) => {
            setTimeout(() => authToasts.registerError(error), index * 100);
          });
        } else {
          authToasts.registerError(data.message);
        }
        return { success: false, message: data.message, errors: data.errors };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      authToasts.registerError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        // Store token for socket connection
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
        authToasts.loginSuccess(data.user.fullName);
        return { success: true, message: data.message };
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: data.message });
        authToasts.loginError(data.message);
        return { success: false, message: data.message, errors: data.errors };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      authToasts.loginError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      // Clear stored token
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      authToasts.logoutSuccess();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear stored token even if logout fails
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      authToasts.logoutSuccess(); // Still show success even if API call fails
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    token: localStorage.getItem('token'),
    register,
    login,
    logout,
    clearError,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
