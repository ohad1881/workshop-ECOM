import React, { createContext, useContext, useState, useEffect, useReducer } from 'react';
import { getToken, setTokens, clearTokens } from '../api/client';

const AuthContext = createContext();

const initialState = {
  user: null,
  loading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_AUTH':
      return {
        ...state,
        isAuthenticated: action.payload,
        loading: false,
      };
    case 'LOGIN':
      return {
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = getToken();
    dispatch({
      type: 'INIT_AUTH',
      payload: !!token,
    });
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    setTokens(accessToken, refreshToken);
    dispatch({
      type: 'LOGIN',
      payload: { user: userData },
    });
  };

  const register = (userData, accessToken, refreshToken) => {
    setTokens(accessToken, refreshToken);
    dispatch({
      type: 'LOGIN',
      payload: { user: userData },
    });
  };

  const logout = () => {
    clearTokens();
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    user: state.user,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    login,
    register,
    logout,
    setUser: (user) => dispatch({
      type: 'LOGIN',
      payload: { user },
    }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
