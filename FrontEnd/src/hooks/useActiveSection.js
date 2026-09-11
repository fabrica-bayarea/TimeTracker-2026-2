import { useEffect, useState } from "react";
import { navItems } from "../data/dashboardData";

/**
 * Hook customizado para monitorar qual seção da página está visível na viewport
 * através da API nativa IntersectionObserver.
 *
 * @param {string} [defaultSection="visao-geral"] - ID da seção inicial ativa
 * @returns {string} ID da seção atualmente ativa/mais visível
 */
export function useActiveSection(defaultSection = "visao-geral") {
  const [activeSection, setActiveSection] = useState(defaultSection);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const sections = navItems
      .map(([id]) => document.getElementById(id))
      .filter(Boolean);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleSection) {
          setActiveSection(visibleSection.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0, 0.25, 0.75],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return activeSection;
}

