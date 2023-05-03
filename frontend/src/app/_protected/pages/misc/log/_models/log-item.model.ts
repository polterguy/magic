
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

/**
 * Encapsulates a single log item from your backend.
 */
export class LogItem {

  /**
   * Unique ID used to identify record.
   */
  id: string;

  /**
   * Date and time when log entry was created.
   */
  created: Date;

  /**
   * Type of log entry, typically 'info' or 'error', etc.
   */
  type: string;

  /**
   * Main text for log entry.
   */
  content: string;

  /**
   * If the log entry was generated as the result of an exception, you will find
   * the exception details in this field - Including its stack trace.
   */
  exception?: string;
}
