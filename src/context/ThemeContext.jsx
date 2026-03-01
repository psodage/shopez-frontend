import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
});

const STORAGE_KEY = 'shopez_theme';

export const ThemeProvider = ({ children }) => {
  // Default to dark mode; user can override via toggle (persisted in localStorage).
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Initialize from localStorage if available; otherwise keep default "dark".
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

