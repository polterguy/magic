
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Schedule } from "./schedule.model";

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
   * Hyperlambda task contains.
   * 
   * Only returned from backend if we choose to retrieve task's details.
   */
  hyperlambda?: string;

  /**
   * Description of task in friendly human readable text.
   */
  description?: string;

  /**
   * List of schedules for task.
   */
  schedules?: Schedule[];
}
