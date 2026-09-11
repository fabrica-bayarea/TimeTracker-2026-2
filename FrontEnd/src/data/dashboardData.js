/**
 * Dados do Dashboard - TimeTracker
 * Módulo centralizado de dados da aplicação
 */

// ============================================================================
// Dados de Atividade Semanal
// ============================================================================

/**
 * @type {Array<{day: string, monitored: number, productive: number, hours: string}>}
 */
export const week = [
  { day: "Seg", monitored: 60, productive: 50, hours: "6.1 h" },
  { day: "Ter", monitored: 74, productive: 64, hours: "7.4 h" },
  { day: "Qua", monitored: 52, productive: 42, hours: "5.2 h" },
  { day: "Qui", monitored: 68, productive: 56, hours: "6.8 h" },
  { day: "Sex", monitored: 62, productive: 48, hours: "6.3 h" },
  { day: "Sáb", monitored: 20, productive: 12, hours: "2.0 h" },
  { day: "Dom", monitored: 10, productive: 6, hours: "1.0 h" },
];

// ============================================================================
// Categorias de Atividade
// ============================================================================

/**
 * @type {Array<{name: string, time: string, value: number, color: string}>}
 */
export const categories = [
  {
    name: "Desenvolvimento",
    time: "3h 18min",
    value: 198,
    color: "#6551e1",
  },
  { name: "Comunicação", time: "1h 42min", value: 102, color: "#28a99d" },
  { name: "Design", time: "1h 08min", value: 68, color: "#f0b84b" },
  { name: "Social", time: "26min", value: 26, color: "#ef7187" },
  { name: "Outros", time: "34min", value: 34, color: "#c7c3f5" },
];

// ============================================================================
// Aplicativos Monitorados
// ============================================================================

/**
 * @type {Array<{name: string, time: string, percent: number, symbol: string, tone: string}>}
 */
export const apps = [
  {
    name: "Visual Studio Code",
    time: "2h 42min",
    percent: 88,
    symbol: "<>",
    tone: "bg-sky-500",
  },
  {
    name: "Google Chrome",
    time: "1h 36min",
    percent: 57,
    symbol: "●",
    tone: "bg-red-500",
  },
  {
    name: "Microsoft Teams",
    time: "54min",
    percent: 33,
    symbol: "T",
    tone: "bg-indigo-500",
  },
  {
    name: "Figma",
    time: "31min",
    percent: 20,
    symbol: "F",
    tone: "bg-pink-500",
  },
];

// ============================================================================
// Timeline do Expediente
// ============================================================================

/**
 * @type {Array<[name: string, time: string, width: number, tone: string]>}
 */
export const timeline = [
  ["Desenvolvimento", "08:10 - 10:35", 25, "bg-indigo-600"],
  ["Comunicação", "10:35 - 11:20", 8, "bg-teal-500"],
  ["Desenvolvimento", "11:20 - 12:30", 12, "bg-indigo-600"],
  ["Pausa", "12:30 - 13:30", 10, "bg-slate-300"],
  ["Design", "13:30 - 15:20", 18, "bg-amber-400"],
  ["Comunicação", "15:20 - 16:05", 8, "bg-teal-500"],
  ["Desenvolvimento", "16:05 - 17:45", 19, "bg-indigo-600"],
];

// ============================================================================
// Membros da Equipe
// ============================================================================

/**
 * @type {Array<[name: string, initials: string, machine: string, app: string, windowName: string, category: string, status: string, time: string, avatar: string]>}
 */
export const people = [
  [
    "Ana Carolina",
    "AC",
    "DESK-AC-01",
    "VS Code",
    "feature/dashboard.razor",
    "Desenvolvimento",
    "Online",
    "há 12s",
    "bg-rose-300",
  ],
  [
    "Bruno Mendes",
    "BM",
    "DESK-BM-02",
    "Chrome",
    "Documentação da API",
    "Comunicação",
    "Online",
    "há 28s",
    "bg-blue-300",
  ],
  [
    "Camila Rocha",
    "CR",
    "MAC-CR-01",
    "Figma",
    "Design System v2",
    "Design",
    "Online",
    "há 41s",
    "bg-pink-300",
  ],
  [
    "Diego Santos",
    "DS",
    "DESK-DS-03",
    "Teams",
    "Reunião semanal",
    "Comunicação",
    "Online",
    "há 55s",
    "bg-emerald-300",
  ],
  [
    "Elisa Martins",
    "EM",
    "DESK-EM-04",
    "VS Code",
    "backend/api",
    "Desenvolvimento",
    "Online",
    "há 1min",
    "bg-yellow-300",
  ],
  [
    "Fabio Costa",
    "FC",
    "MAC-FC-02",
    "Slack",
    "Canal #tech",
    "Comunicação",
    "Idle",
    "há 3min",
    "bg-cyan-300",
  ],
];

// ============================================================================
// Navegação e Menu
// ============================================================================

/**
 * @type {Array<[id: string, icon: string, label: string]>}
 */
export const navItems = [
  ["visao-geral", "▦", "Visão geral"],
  ["atividade", "◷", "Atividades"],
  ["timesheet", "▤", "Timesheet"],
  ["equipe", "♧", "Equipe"],
  ["relatorios", "▱", "Relatórios"],
];
