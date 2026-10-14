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

/**
 * @typedef {{ capture_interval_seconds: number, idle_timeout_seconds: number, updated_at?: string | null }} SystemSettings
 */

/** @typedef {{ email: string, password: string }} ManagerCredentials */

/**
 * @typedef {Object} ManagerProfile
 * @property {string} id
 * @property {string} email
 * @property {string | null} [association_code]
 * @property {string} created_at
 */

/** @typedef {ManagerProfile} Manager */

/**
 * @typedef {Object} AuthToken
 * @property {string} access_token
 * @property {string} token_type
 * @property {number} expires_in
 */

/** @typedef {AuthToken} ManagerToken */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string | null} [description]
 * @property {'pending' | 'in_progress' | 'completed' | string} status
 * @property {string} manager_id
 * @property {string} created_at
 * @property {string} updated_at
 * @property {User[]} [assigned_users]
 * @property {number} [total_duration_seconds]
 */

/** @typedef {'client' | 'server' | 'network' | 'timeout' | 'canceled' | 'invalid-response'} ApiErrorType */

/**
 * @typedef {Object} ApiClient
 * @property {(signal?: AbortSignal) => Promise<User[]>} users
 * @property {(signal?: AbortSignal) => Promise<RealtimeEntry[]>} realtime
 * @property {(date: string, username?: string, signal?: AbortSignal) => Promise<DailySummary>} summary
 * @property {(signal?: AbortSignal) => Promise<SystemSettings>} settings
 * @property {(payload: SystemSettings, signal?: AbortSignal) => Promise<SystemSettings>} saveSettings
 * @property {(format: 'csv' | 'pdf', date: string, username?: string, signal?: AbortSignal) => Promise<Blob>} exportFile
 * @property {(credentials: { email: string, password: string }, signal?: AbortSignal) => Promise<AuthToken>} login
 * @property {(data: { email: string, password: string }, signal?: AbortSignal) => Promise<ManagerProfile>} register
 * @property {(signal?: AbortSignal) => Promise<ManagerProfile>} me
 * @property {(credentials: ManagerCredentials, signal?: AbortSignal) => Promise<Manager>} [registerManager]
 * @property {(credentials: ManagerCredentials, signal?: AbortSignal) => Promise<ManagerToken>} [loginManager]
 * @property {(accessToken: string, signal?: AbortSignal) => Promise<Manager>} [getCurrentManager]
 * @property {(status?: string, signal?: AbortSignal) => Promise<Task[]>} tasks
 * @property {(payload: { title: string, description?: string, status?: string, assigned_user_ids?: string[] }, signal?: AbortSignal) => Promise<Task>} createTask
 * @property {(taskId: string, payload: { title?: string, description?: string, status?: string, assigned_user_ids?: string[] }, signal?: AbortSignal) => Promise<Task>} updateTask
 * @property {(taskId: string, signal?: AbortSignal) => Promise<void>} deleteTask
 */

export {};
