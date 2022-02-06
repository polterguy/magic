
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

/**
 * Model returned from backend as user authenticates.
 */
export class AuthenticateResponse {

  /**
   * Actual JWT token as returned from server.
   */
  ticket: string;
}
  