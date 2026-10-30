/**
 * API response fields consumed by this frontend. Fields marked optional are not
 * guaranteed by the current runtime validators, even when FastAPI emits them.
 *
 * @typedef {Object} User
 * @property {string} username
 * @property {string | null} [id]
 * @property {string | null} [full_name]
 * @property {string | null} [department]
 * @property {string | null} [created_at]
 */

/**
 * @typedef {User & {
 *   status: 'online' | 'ausente' | 'offline',
 *   seconds_since_last_activity: number,
 *   hostname?: string | null,
 *   process_name?: string | null,
 *   window_title?: string | null,
 *   category?: string | null,
 *   is_idle?: boolean
 * }} RealtimeEntry
 */

/**
 * @typedef {{ category: string, total_seconds: number, color?: string }} CategorySummary
 */

/**
 * @typedef {{ username: string, total_seconds: number, by_category: CategorySummary[] }} UserDailySummary
 */

/**
 * @typedef {{ date: string, users: UserDailySummary[] }} DailySummary
 */

/** @typedef {{ id: string, username: string, full_name?: string | null }} TaskCollaborator */

/**
 * Response from the authenticated manager Task API.
 * @typedef {{ id: string, title: string, description: string | null, collaborators: TaskCollaborator[], created_at: string, updated_at: string }} Task
 */

/** @typedef {{ title: string, description?: string | null, collaborator_ids?: string[] }} TaskCreate */

/** @typedef {{ title?: string, description?: string | null, collaborator_ids?: string[] }} TaskUpdate */

/**
 * @typedef {{
 *   username: string,
 *   first_activity_at: string | null,
 *   last_activity_at: string | null
 * }} AttendanceUser
 */

/** @typedef {{ date: string, timezone: 'America/Sao_Paulo', as_of: string, users: AttendanceUser[] }} Attendance */

/** @typedef {{ task_id: string, description: string, total_seconds: number }} TaskHoursEntry */

/**
 * @typedef {{
 *   start_date: string,
 *   end_date: string,
 *   timezone: 'America/Sao_Paulo',
 *   tasks: TaskHoursEntry[]
 * }} TaskHours
 */

/**
 * Candidate shape for GET /dashboard/tasks-summary; not an implemented backend contract.
 * A null task_id represents general activity without a linked Task.
 * @typedef {{ task_id: string | null, title: string, total_seconds: number, collaborators: TaskCollaborator[] }} TaskSummaryEntry
 */

/** @typedef {{ date: string, timezone: 'America/Sao_Paulo', tasks: TaskSummaryEntry[] }} TaskSummary */

/**
 * @typedef {{
 *   username: string,
 *   hostname: string,
 *   last_record_at: string | null,
 *   connection_status: 'online' | 'offline' | 'unknown'
 * }} AgentStatus
 */

/** @typedef {{ agents: AgentStatus[] }} AgentStatusResponse */

/**
 * @typedef {{ capture_interval_seconds: number, idle_timeout_seconds: number, updated_at?: string | null }} SystemSettings
 */

/** @typedef {{ email: string, password: string }} ManagerCredentials */

/**
 * Public fields returned by `ManagerOut`; registration does not include the
 * association code.
 * @typedef {{ id: string, email: string, created_at: string }} Manager
 */

/** @typedef {Manager & { association_code: string }} ManagerProfile */

/** @typedef {{ access_token: string, token_type: 'bearer', expires_in: number }} ManagerToken */

/** @typedef {'client' | 'server' | 'network' | 'timeout' | 'canceled' | 'invalid-response'} ApiErrorType */

/**
 * @typedef {Object} ApiClient
 * @property {(signal?: AbortSignal) => Promise<User[]>} users
 * @property {(signal?: AbortSignal) => Promise<RealtimeEntry[]>} realtime
 * @property {(date: string, username?: string, signal?: AbortSignal) => Promise<DailySummary>} summary
 * @property {(signal?: AbortSignal) => Promise<SystemSettings>} settings
 * @property {(payload: SystemSettings, signal?: AbortSignal) => Promise<SystemSettings>} saveSettings
 * @property {(format: 'csv' | 'pdf', date: string, username?: string, signal?: AbortSignal) => Promise<Blob>} exportFile
 * @property {(credentials: ManagerCredentials, signal?: AbortSignal) => Promise<Manager>} registerManager
 * @property {(credentials: ManagerCredentials, signal?: AbortSignal) => Promise<ManagerToken>} loginManager
 * @property {(accessToken: string, signal?: AbortSignal) => Promise<ManagerProfile>} getCurrentManager
 * @property {(signal?: AbortSignal) => Promise<string>} getAssociationCode
 * @property {(signal?: AbortSignal) => Promise<Task[]>} tasks
 * @property {(taskId: string, signal?: AbortSignal) => Promise<Task>} getTask
 * @property {(payload: TaskCreate, signal?: AbortSignal) => Promise<Task>} createTask
 * @property {(taskId: string, payload: TaskUpdate, signal?: AbortSignal) => Promise<Task>} updateTask
 * @property {(taskId: string, signal?: AbortSignal) => Promise<void>} deleteTask
 */

export {};
