import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, UserProfile, TodayStatusResponse } from '@/services/api';
import { StorageService } from '@/services/storage';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isManager: boolean;
  isHR: boolean;
  isShiftWorker: boolean;
  faceRegistered: boolean;
  todayStatus: TodayStatusResponse | null;
  refreshTodayStatus: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
  switchDemoAccount: (accountKey: 'alex.morgan' | 'budi.santoso' | 'maya.chen' | 'admin.hr') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [todayStatus, setTodayStatus] = useState<TodayStatusResponse | null>(null);

  // Initialize Auth state from Storage
  useEffect(() => {
    async function loadAuth() {
      try {
        const storedToken = await StorageService.getToken();
        const storedUser = await StorageService.getUser();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          const today = await api.getTodayAttendance();
          setTodayStatus(today);
        }
      } catch (e) {
        console.warn('Failed to load initial auth state:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadAuth();
  }, []);

  const refreshTodayStatus = async () => {
    try {
      const today = await api.getTodayAttendance();
      setTodayStatus(today);
    } catch (e) {
      console.warn('Error refreshing today attendance:', e);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(username, password);
      setToken(res.data.token);
      setUser(res.data.user);
      const today = await api.getTodayAttendance();
      setTodayStatus(today);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setToken(null);
      setUser(null);
      setTodayStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updated: UserProfile) => {
    setUser(updated);
    StorageService.setUser(updated);
  };

  const switchDemoAccount = async (accountKey: 'alex.morgan' | 'budi.santoso' | 'maya.chen' | 'admin.hr') => {
    await login(accountKey, 'password123');
  };

  const isManager = user?.role === 'manager' || user?.role === 'super_admin';
  const isHR = user?.role === 'admin_hr' || user?.role === 'super_admin';
  const isShiftWorker = user?.employee?.is_shift_worker ?? false;
  const faceRegistered = user?.employee?.face_registered ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isManager,
        isHR,
        isShiftWorker,
        faceRegistered,
        todayStatus,
        refreshTodayStatus,
        login,
        logout,
        updateUser,
        switchDemoAccount,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

