import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const { data } = await api.post('/auth/login', { email, password });
      
      const userInfo = {
         token: data.token,
         ...data.user
      };
      
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      setUser(userInfo);
      return userInfo;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  const register = async (name, email, password, role) => {
    try {
      setError(null);
      const { data } = await api.post('/auth/register', { name, email, password, role });
      
      const userInfo = {
         token: data.token,
         ...data.user
      };
      
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      setUser(userInfo);
      return userInfo;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw new Error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
