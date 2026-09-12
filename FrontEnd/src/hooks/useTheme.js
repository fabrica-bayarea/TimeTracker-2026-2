import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "timetracker-theme";

/**
 * Hook customizado para gerenciamento e persistência de tema (claro / escuro).
 *
 * Sincroniza o estado com o `localStorage` e reflete a escolha no atributo
 * `data-theme` do elemento raiz `<html>`.
 *
 * @returns {[boolean, () => void]} Tupla contendo [isDarkMode, toggleTheme]
 */
export function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        return savedTheme === "dark";
      }
    } catch {
      // Ignora falhas de acesso ao localStorage (e.g. sandbox ou permissão restrita)
    }

    if (window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    return false;
  });

  useEffect(() => {
    const theme = dark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignora falhas de acesso ao localStorage
    }
  }, [dark]);

  const toggleTheme = () => {
    setDark((currentDark) => !currentDark);
  };

  return [dark, toggleTheme];
}

