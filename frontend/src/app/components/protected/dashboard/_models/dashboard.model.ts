/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

/**
 * Retrieving reports on the health and activities of your backend.
 */
export interface SystemReport {
  default_db?: string,
  default_timezone?: string, // "none", "utc" or "local"
}
