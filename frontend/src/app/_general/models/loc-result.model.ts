
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
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
