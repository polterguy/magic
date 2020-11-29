
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Encapsulates a single log item from your backend.
 */
export class LogItem {
  id: number;
  created: Date;
  type: string;
  content: string;
  exception?: string;
}
