import { useEffect, useState } from "react";
import { navItems } from "../data/dashboardData";
import { fetchDashboardData } from "../services/api";

export function useDashboardData(selectedDate) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    setState({ data: null, loading: true, error: null });

    fetchDashboardData(selectedDate, controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ data: null, loading: false, error });
        }
      });

    return () => controller.abort();
  }, [selectedDate]);

  return state;
}

/**
 * Hook para gerenciar o tema (escuro/claro)
 * Persiste a preferência do usuário no localStorage
 * 
 * @returns {[boolean, function]} - [isDarkMode, toggleTheme]
 */
export function useTheme() {
  const [dark, setDark] = useState(() => {
    // Inicializa com valor persistido no localStorage ou false
    return localStorage.getItem("timetracker-theme") === "dark";
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
