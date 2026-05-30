/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { setOnSessionExpired } from '../services/sessionEvents.js';
import { useIdleTimeout } from '../hooks/useIdleTimeout.js';
import {
  clearSession,
  getStoredSession,
  isTokenExpired,
  persistSession,
  SESSION_KEY,
} from '../utils/session.js';
import {
  clearSessionActivity,
  setSessionActivityNow,
} from '../utils/sessionActivity.js';

export const AuthContext = createContext();

const buildUserInfo = (authPayload, rememberMe) => ({
  token: authPayload.token,
  expiresAt: authPayload.expiresAt ?? null,
  rememberMe,
  ...authPayload.user,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionMessage, setSessionMessage] = useState(null);
  const [sessionMessageType, setSessionMessageType] = useState('error');

  // Helper to update user state safely
  const updateUser = (updater) => {
    setUser(prev => {
      if (typeof updater === 'function') {
        return updater(prev);
      }
      return { ...prev, ...updater };
    });
  };

  const logout = useCallback((options = {}) => {
    clearSession();
    clearSessionActivity();
    setUser(null);
    if (options.reason === 'inactivity') {
      setSessionMessage('You were signed out due to inactivity. Please sign in again.');
      setSessionMessageType('error');
    } else if (options.expired || options.reason === 'expired' || options.reason === 'unauthorized') {
      setSessionMessage('Your session has expired. Please sign in again.');
      setSessionMessageType('error');
    } else if (options.reason === 'password_changed') {
      setSessionMessage('Password changed, please login again.');
      setSessionMessageType('success');
    }
  }, []);

  const handleIdleLogout = useCallback(() => {
    logout({ reason: 'inactivity' });
  }, [logout]);

  useIdleTimeout({
    enabled: Boolean(user) && !loading,
    onIdle: handleIdleLogout,
  });

  const clearSessionMessage = useCallback(() => {
    setSessionMessage(null);
    setSessionMessageType('error');
  }, []);

  const restoreSession = useCallback(async () => {
    const stored = getStoredSession();
    if (!stored?.token) {
      setLoading(false);
      return;
    }

    if (isTokenExpired(stored.token)) {
      clearSession();
      setSessionMessage('Your session has expired. Please sign in again.');
      setSessionMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      const userInfo = buildUserInfo(
        { token: stored.token, expiresAt: stored.expiresAt, user: data.user },
        stored.rememberMe !== false
      );
      persistSession(userInfo, userInfo.rememberMe);
      setSessionActivityNow();
      setUser(userInfo);
    } catch {
      clearSession();
      setSessionMessage('Your session has expired. Please sign in again.');
      setSessionMessageType('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => {
      logout({ reason: 'unauthorized' });
    });
    restoreSession();
  }, [logout, restoreSession]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== SESSION_KEY) return;
      if (event.newValue === null && user) {
        setUser(null);
        setSessionMessage('Your session has expired. Please sign in again.');
        setSessionMessageType('error');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user]);

  const login = async (email, password, rememberMe = true) => {
    try {
      setError(null);
      setSessionMessage(null);
      const { data } = await api.post('/auth/login', { email, password });

      const userInfo = buildUserInfo(data, rememberMe);
      persistSession(userInfo, rememberMe);
      setSessionActivityNow();
      setUser(userInfo);
      return userInfo;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  const register = async (name, email, password, rememberMe = true) => {
    try {
      setError(null);
      setSessionMessage(null);
      const { data } = await api.post('/auth/register', { name, email, password });

      const userInfo = buildUserInfo(data, rememberMe);
      persistSession(userInfo, rememberMe);
      setSessionActivityNow();
      setUser(userInfo);
      return userInfo;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw new Error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        sessionMessage,
        sessionMessageType,
        clearSessionMessage,
        login,
        logout,
        register,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
