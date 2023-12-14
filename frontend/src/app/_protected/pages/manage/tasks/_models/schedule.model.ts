
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

/**
 * A schedule for a scheduled task.
 */
export class Schedule {

  /**
   * Unique ID for schedule instance.
   */
  id: number;

  /**
   * Next due date for task.
   */
  due: Date;

  /**
   * Contains the repetition pattern of task, if task is repeating.
   */
  repeats?: string;
}
