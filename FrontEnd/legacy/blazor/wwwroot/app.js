// Mantém o tema escolhido no navegador e atualiza o controle visual correspondente.
window.timeTrackerTheme = {
    isDark: () => localStorage.getItem("timetracker-theme") === "dark",
    apply: (isDark) => {
        document.documentElement.dataset.theme = isDark ? "dark" : "light";
        localStorage.setItem("timetracker-theme", isDark ? "dark" : "light");

        // O botão existe apenas nas páginas que oferecem alternância de tema.
        const button = document.querySelector(".theme-button");
        if (button) {
            button.textContent = isDark ? "☀" : "☾";
            const label = isDark ? "Usar tema claro" : "Usar tema escuro";
            button.setAttribute("aria-label", label);
            button.setAttribute("title", label);
        }
    },
    toggle: () => window.timeTrackerTheme.apply(!window.timeTrackerTheme.isDark())
};

window.timeTrackerTheme.apply(window.timeTrackerTheme.isDark());

window.timeTrackerSidebar = {
    isCollapsed: () => localStorage.getItem("timetracker-sidebar") === "collapsed",
    apply: (isCollapsed) => {
        const shell = document.querySelector(".app-shell");
        const button = document.querySelector(".sidebar-toggle");

        if (!shell || !button) {
            return;
        }

        shell.classList.toggle("sidebar-collapsed", isCollapsed);
        button.setAttribute("aria-expanded", String(!isCollapsed));
        const label = isCollapsed ? "Expandir menu lateral" : "Minimizar menu lateral";
        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);
        button.querySelector("span").textContent = isCollapsed ? "›" : "‹";
        localStorage.setItem("timetracker-sidebar", isCollapsed ? "collapsed" : "expanded");
    },
    toggle: () => window.timeTrackerSidebar.apply(!window.timeTrackerSidebar.isCollapsed())
};

window.timeTrackerSidebar.apply(window.timeTrackerSidebar.isCollapsed());

window.timeTrackerExports = {
    downloadCsv: () => {
        const report = createDailyReport();
        const csv = convertRowsToCsv(report);
        downloadTextFile(csv, "timetrack-relatorio-diario.csv", "text/csv;charset=utf-8");
    },
    printReport: () => window.print()
};

function createDailyReport() {
    return [
        ["Colaborador", "Máquina", "Aplicativo", "Janela", "Categoria", "Status"],
        ["Ana Carolina", "DESK-AC-01", "VS Code", "feature/dashboard.razor", "Desenvolvimento", "Online"],
        ["Bruno Mendes", "DESK-BM-02", "Chrome", "Documentação da API", "Comunicação", "Online"],
        ["Camila Rocha", "MAC-CR-01", "Figma", "Design System v2", "Design", "Online"],
        ["Diego Santos", "DESK-DS-03", "Teams", "Reunião semanal", "Comunicação", "Ausente"]
    ];
}

function convertRowsToCsv(rows) {
    return rows.map(convertRowToCsv).join("\n");
}

function convertRowToCsv(row) {
    return row.map(escapeCsvValue).join(",");
}

function escapeCsvValue(value) {
    return `"${value.replaceAll('"', '""')}"`;
}

function downloadTextFile(content, fileName, contentType) {
    const file = new Blob(["\ufeff" + content], { type: contentType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}

// Controla o item ativo da navegação lateral, inclusive durante a rolagem da página.
window.timeTrackerNavigation = {
    setActive: (selectedLink) => {
        document.querySelectorAll(".sidebar .nav-link")
            .forEach((link) => {
                link.classList.remove("active");
                link.removeAttribute("aria-current");
            });
        selectedLink.classList.add("active");
        selectedLink.setAttribute("aria-current", "page");
    },
    observeSections: () => {
        // Apenas links associados a seções reais participam do acompanhamento automático.
        const links = [...document.querySelectorAll(".sidebar .nav-link[data-section]")];
        const sections = links
            .map((link) => document.getElementById(link.dataset.section))
            .filter(Boolean)
            .sort((first, second) => first.offsetTop - second.offsetTop);

        if (!sections.length || !("IntersectionObserver" in window)) {
            return;
        }

        const updateActiveSection = () => {
            // Usa uma linha de referência no viewport para decidir qual seção está em evidência.
            const markerPosition = window.innerHeight * 0.3;
            const isAtPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
            const currentSection = isAtPageEnd
                ? sections.at(-1)
                : sections.filter((section) => section.getBoundingClientRect().top <= markerPosition).at(-1) || sections[0];
            const activeLink = links.find((link) => link.dataset.section === currentSection.id);

            if (activeLink) {
                window.timeTrackerNavigation.setActive(activeLink);
            }
        };

        const observer = new IntersectionObserver(updateActiveSection, { threshold: [0, 1] });

        sections.forEach((section) => observer.observe(section));
        updateActiveSection();
    }
};

window.timeTrackerNavigation.observeSections();
