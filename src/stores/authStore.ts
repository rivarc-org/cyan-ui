import { create } from 'zustand';
import { authApi, type User } from '@/api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as loading until we check session

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors - we still want to clear local state
    }
    set({ user: null, isAuthenticated: false });
    // Navigate to home - ProtectedRoute will redirect to login
    window.location.href = '/';
  },
}));
