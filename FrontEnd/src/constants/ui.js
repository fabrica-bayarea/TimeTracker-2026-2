/**
 * Constantes de Interface (UI) do TimeTracker
 * Centraliza valores visuais repetidos, paletas e mapeamentos de status.
 */

/**
 * Paleta de cores para avatares de colaboradores na equipe
 */
export const AVATAR_COLOR_PALETTE = [
  "bg-rose-300",
  "bg-blue-300",
  "bg-pink-300",
  "bg-emerald-300",
  "bg-yellow-300",
  "bg-cyan-300",
];

/**
 * Rótulos legíveis para o status de conexão com a API
 */
export const API_STATUS_LABELS = {
  loading: "Conectando à API",
  offline: "API offline",
  online: "API online",
};

/**
 * Mapeamento de status de presença de colaboradores
 */
export const USER_STATUS_LABELS = {
  online: "Online",
  idle: "Ausente",
  offline: "Offline",
};

