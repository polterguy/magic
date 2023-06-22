/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

/**
 * Retrieving reports on the health and activities of your backend.
 */
export interface SystemReport {
  cache_items?: number,
  default_db?: string,
  default_timezone?: string, // "none", "utc" or "local"
  dynamic_slots?: number,
  endpoints?: number,
  has_scheduler?: boolean,
  has_sockets?: boolean,
  has_terminal?: boolean,
  persisted_tasks?: number,
  version?: string,
  server_ip?: string,
  slots?: number,
  log_items?: number,
  last_log_items?: LastLogItems[],
  modules?: Modules[],
  log_types?: LogTypes[],
  timeshifts?: Timeshifts[]
}

/**
 * type of logs created on the backend
 */
export interface LogTypes {
  debug?: number,
  error?: number,
  fatal?: number
}

/**
 * Displaying the of login details on the system
 */
export interface Timeshifts {
  variable?: {
    description?: string,
    name?: string,
    items?: [{
      when?: Date,
      count?: number
    }]
  }
}

/**
 * Displaying the complexity of modules
 */
export interface Modules {
  variable?: [{
    files?: number,
    loc?: number
  }]
}

/**
 * Displaying the complexity of modules
 */
export interface LastLogItems {
  id: string,
  content?: string,
  type?: string,
  created?: string,
  exception?: string,
  meta?: {
    variable?: string
  }
}
