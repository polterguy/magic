
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Application specific imports
import { MagicResponse } from './magic-response.model';

/**
 * Model returned from backend when code is generated.
 */
export class LocResult extends MagicResponse {

  /**
   * Lines of code generated during invocation to backend.
   */
  loc: number;

  /**
   * Optional result message from server.
   */
  result: string;
}
