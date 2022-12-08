
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Application specific imports
import { Response } from '../../../../../models/response.model';

/**
 * Model returned from backend when code is generated.
 */
export class LocResult extends Response {

  /**
   * Lines of code generated during invocation to backend.
   */
  loc: number;
}
  