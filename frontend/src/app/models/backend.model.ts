
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

/**
 * Encapsulates a backend instance.
 */
export class Backend {

  /**
   * Backend's URL.
   */
  url: string;

  /**
   * Username used to authenticate user towards backend.
   */
  username?: string;

  /**
   * Password used to authenticate user towards backend.
   */
  password?: string;

  /**
   * JWT token as returned from backend during authentication.
   */
  token?: string;
}
  