import { useCallback, useEffect, useState } from "react";
import { fetchDashboardData } from "../services/api";

/**
 * @typedef {Object} DashboardState
 * @property {Object|null} data - Dados retornados pela API contendo summary, realtime, users e weeklySummaries
 * @property {boolean} loading - Indica se a primeira consulta do filtro atual está em andamento
 * @property {boolean} refreshing - Indica se uma recarga para o mesmo filtro está em andamento
 * @property {Error|null} error - Último erro retornado pela requisição (não cancelada)
 * @property {Date|null} updatedAt - Momento da última sincronização bem-sucedida
 * @property {string|null} dataDate - Chave combinada de data e usuário da última consulta concluída
 * @property {() => void} refresh - Função para forçar recarga manual dos dados atuais
 */

/**
 * Hook customizado para orquestrar a busca e atualização periódica de dados do dashboard.
 *
 * @param {string} selectedDate - Data da consulta no formato YYYY-MM-DD
 * @param {string} [selectedUsername=""] - Nome do colaborador selecionado ou vazio para todos
 * @param {boolean} [autoRefresh=true] - Se a atualização automática a cada 30 segundos está ativa
 * @returns {DashboardState} Estado consolidado do dashboard e função de atualização manual
 */
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
    let refreshTimer = null;
    const filterKey = `${selectedDate}:${selectedUsername}`;

    setState((current) => {
      const isSameFilter = current.dataDate === filterKey;
      return {
        data: isSameFilter ? current.data : null,
        loading: !isSameFilter,
        refreshing: isSameFilter && Boolean(current.data),
        error: null,
        updatedAt: isSameFilter ? current.updatedAt : null,
        dataDate: isSameFilter ? current.dataDate : null,
      };
    });

    fetchDashboardData(selectedDate, selectedUsername, controller.signal)
      .then((data) => {
        setState({
          data,
          loading: false,
          refreshing: false,
          error: null,
          updatedAt: new Date(),
          dataDate: filterKey,
        });
      })
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

