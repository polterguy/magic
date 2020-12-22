
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Encapsulates a single task from your backend.
 */
export class Task {

  /**
   * Unique ID of task.
   */
  id: string;

  /**
   * Date when task was created.
   */
  created: Date;

  /**
   * Hyperlambda task contains,
   */
  hyperlambda: string;
}
