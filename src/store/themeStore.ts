import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: () => 'light' | 'dark';
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark');
  root.classList.toggle('dark', isDark);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      resolvedTheme: () => {
        const { theme } = get();
        if (theme === 'system') {
          return getSystemTheme();
        }
        return theme;
      },
    }),
    {
      name: 'cyan-theme',
    }
  )
);

// Initialize theme on app load
export function initializeTheme() {
  const theme = useThemeStore.getState().theme;
  applyTheme(theme);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useThemeStore.getState().theme === 'system') {
      applyTheme('system');
    }
  });
}
