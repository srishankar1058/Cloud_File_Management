/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ThemeContext — app-wide light/dark mode.
 *
 * Persistence layers (in order of priority):
 *  1. Firebase profile (payload.theme) — synced via saveUserProfile, so the
 *     preference follows the user across devices/browsers.
 *  2. localStorage("omnidrive:theme") — instant on next load, before the
 *     profile fetch resolves, and works offline.
 *  3. Falls back to the OS-level prefers-color-scheme on first-ever visit.
 *
 * The <html> element gets a "dark" class toggled on it, which is what every
 * Tailwind `dark:` utility throughout the app keys off (see the
 * @custom-variant directive in index.css).
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Theme } from '../types';

const LS_THEME_KEY = 'omnidrive:theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(LS_THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem(LS_THEME_KEY, theme); } catch {}
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark')), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
