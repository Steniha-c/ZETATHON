import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Team, Submission } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: UserProfile | null;
  team: Team | null;
  submission: Submission | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: { email: string; password: string }) => Promise<UserProfile | null>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setTeam: React.Dispatch<React.SetStateAction<Team | null>>;
  setSubmission: React.Dispatch<React.SetStateAction<Submission | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('zetathon_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('zetathon_token');
    if (!savedToken) {
      setUser(null);
      setTeam(null);
      setSubmission(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      if (data.success && data.user) {
        setUser(data.user);
        setTeam(data.team || null);
        setSubmission(data.submission || null);
      }
    } catch (err) {
      console.warn('Failed to refresh user profile, clearing stale token.');
      localStorage.removeItem('zetathon_token');
      setUser(null);
      setTeam(null);
      setSubmission(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      if (res.token) {
        localStorage.setItem('zetathon_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setTeam(res.team || null);
        // fetch fresh submission
        await refreshUser();
        return res.user || null;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      if (res.token) {
        localStorage.setItem('zetathon_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setTeam(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('zetathon_token');
    setToken(null);
    setUser(null);
    setTeam(null);
    setSubmission(null);
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = Boolean(user?.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        team,
        submission,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
        setTeam,
        setSubmission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
