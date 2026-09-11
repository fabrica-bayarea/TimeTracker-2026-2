import { useCallback, useEffect, useState } from "react";
import { navItems } from "../data/dashboardData";
import { fetchDashboardData } from "../services/api";

export function useDashboardData(selectedDate, selectedUsername = "", autoRefresh = true) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    refreshing: false,
    error: null,
    updatedAt: null,
    dataDate: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let refreshTimer;

    setState((current) => ({
      data: current.dataDate === `${selectedDate}:${selectedUsername}` ? current.data : null,
      loading: current.dataDate !== `${selectedDate}:${selectedUsername}`,
      refreshing: current.dataDate === `${selectedDate}:${selectedUsername}` && Boolean(current.data),
      error: null,
      updatedAt:
        current.dataDate === `${selectedDate}:${selectedUsername}`
          ? current.updatedAt
          : null,
      dataDate: current.dataDate === `${selectedDate}:${selectedUsername}` ? current.dataDate : null,
    }));

    fetchDashboardData(selectedDate, selectedUsername, controller.signal)
      .then((data) =>
        setState({
          data,
          loading: false,
          refreshing: false,
          error: null,
          updatedAt: new Date(),
          dataDate: `${selectedDate}:${selectedUsername}`,
        }),
      )
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState((current) => ({
            data: current.data,
            loading: false,
            refreshing: false,
            error,
            updatedAt: current.updatedAt,
            dataDate: current.dataDate,
          }));
        }
      });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (refreshTimer) {
          window.clearInterval(refreshTimer);
          refreshTimer = null;
        }
      } else {
        refresh();
        if (autoRefresh && !refreshTimer) {
          refreshTimer = window.setInterval(refresh, 30_000);
        }
      }
    };

    if (autoRefresh && !document.hidden) {
      refreshTimer = window.setInterval(refresh, 30_000);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      controller.abort();
      if (refreshTimer) window.clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedDate, selectedUsername, autoRefresh, refreshKey, refresh]);

  return { ...state, refresh };
}

/**
 * Hook para gerenciar o tema (escuro/claro)
 * Persiste a preferência do usuário no localStorage com fallback para o sistema operacional
 * 
 * @returns {[boolean, function]} - [isDarkMode, toggleTheme]
 */
export function useTheme() {
  const [dark, setDark] = useState(() => {
    const savedTheme = localStorage.getItem("timetracker-theme");
    if (savedTheme !== null) {
      return savedTheme === "dark";
    }
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Atualiza o documento e localStorage quando o tema muda
  useEffect(() => {
    const theme = dark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("timetracker-theme", theme);
  }, [dark]);

  const toggleTheme = () => {
    setDark((currentDark) => !currentDark);
  };

  return [dark, toggleTheme];
}

/**
 * Hook para rastrear a seção ativa na página
 * Usa Intersection Observer para determinar qual seção está visível
 * 
 * @returns {string} - ID da seção ativa
 */
export function useActiveSection() {
  const [activeSection, setActiveSection] = useState("visao-geral");

  useEffect(() => {
    // Obtém os elementos DOM das seções
    const sections = navItems
      .map(([id]) => document.getElementById(id))
      .filter(Boolean);

    if (sections.length === 0) return;

    // Cria observador para detectar seções visíveis
    const observer = new IntersectionObserver(
      (entries) => {
        // Encontra a seção mais visível
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => {
            // Ordena por proporção de visibilidade
            return second.intersectionRatio - first.intersectionRatio;
          })[0];

        if (visibleSection) {
          setActiveSection(visibleSection.target.id);
        }
      },
      {
        // Margem para considerar uma seção "visível"
        rootMargin: "-20% 0px -65% 0px",
        // Pontos de threshold para cálculo de visibilidade
        threshold: [0, 0.25, 0.75],
      }
    );

    // Observa todas as seções
    sections.forEach((section) => observer.observe(section));

    // Limpa observador ao desmontar
    return () => observer.disconnect();
  }, []);

  return activeSection;
}
