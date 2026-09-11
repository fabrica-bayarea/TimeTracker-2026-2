/**
 * Módulo de Relatórios
 * Funcionalidades para exportação e formatação de dados
 */

/**
 * Cria um relatório diário formatado a partir dos dados de colaboradores
 * 
 * @param {Array<Array>} people - Array com dados dos colaboradores
 * @returns {Array<Array>} - Dados formatados com cabeçalho
 * 
 * @example
 * const people = [["Ana", "AC", "DESK-AC-01", "VS Code", "file.ts", "Dev", "Online", "12s", "bg-color"]];
 * const report = createDailyReport(people);
 * // Retorna: [["Colaborador", ...], ["Ana", "DESK-AC-01", ...]]
 */
export function createDailyReport(people) {
  const headers = [
    "Colaborador",
    "Máquina",
    "Aplicativo",
    "Janela",
    "Categoria",
    "Status",
  ];

  const rows = people.map(
    ([name, , machine, app, windowName, category, status]) => [
      name,
      machine,
      app,
      windowName,
      category,
      status,
    ]
  );

  return [headers, ...rows];
}

/**
 * Escapa caracteres especiais em valores CSV
 * Envolve valores em aspas e escapa aspas internas duplicando-as
 * 
 * @param {string} value - Valor a ser escapado
 * @returns {string} - Valor escapado entre aspas
 * 
 * @example
 * escapeCsvValue('Nome "Teste"');
 * // Retorna: '"Nome ""Teste"""'
 */
function escapeCsvValue(value) {
  // Converte para string se necessário
  const stringValue = String(value || "");
  // Escapa aspas duplicando-as e envolve em aspas
  return `"${stringValue.replaceAll('"', '""')}"`;
}

/**
 * Converte array de arrays em formato CSV
 * 
 * @param {Array<Array>} rows - Array de linhas, onde cada linha é um array de valores
 * @returns {string} - String formatada em CSV
 * 
 * @example
 * const rows = [["Nome", "Email"], ["João", "joao@email.com"]];
 * const csv = convertRowsToCsv(rows);
 * // Retorna: "\"Nome\",\"Email\"\n\"João\",\"joao@email.com\""
 */
export function convertRowsToCsv(rows) {
  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}

/**
 * Faz download de um arquivo de texto
 * Cria um blob, gera URL temporária e dispara download do navegador
 * 
 * @param {string} content - Conteúdo do arquivo
 * @param {string} fileName - Nome do arquivo a ser baixado
 * @param {string} contentType - MIME type do arquivo (ex: "text/csv;charset=utf-8")
 * 
 * @example
 * downloadTextFile("Hello World", "greeting.txt", "text/plain;charset=utf-8");
 */
export function downloadTextFile(content, fileName, contentType) {
  // Cria blob com BOM UTF-8 (para compatibilidade com Excel)
  const file = new Blob(["\ufeff" + content], { type: contentType });

  // Gera URL de objeto
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = fileName;

  // Dispara download
  link.click();

  // Libera recurso
  URL.revokeObjectURL(link.href);
}

/**
 * Formata um valor de tempo em minutos para formato legível (hh:mm)
 * 
 * @param {number} minutes - Quantidade de minutos
 * @returns {string} - Formato "Xh XXmin" ou apenas "Xh" se minutos = 0
 * 
 * @example
 * formatTime(142);
 * // Retorna: "2h 22min"
 * 
 * formatTime(60);
 * // Retorna: "1h"
 */
export function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}

/**
 * Calcula porcentagem formatada
 * 
 * @param {number} value - Valor parcial
 * @param {number} total - Valor total
 * @param {number} decimals - Casas decimais (padrão: 1)
 * @returns {string} - Porcentagem formatada com símbolo %
 * 
 * @example
 * calculatePercentage(30, 100);
 * // Retorna: "30.0%"
 */
export function calculatePercentage(value, total, decimals = 1) {
  if (total === 0) return "0%";
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}
