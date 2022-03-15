
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

/**
 * Encapsulates a backend instance, in addition to its username, password, and if existing also
 * a currently active JWT token.
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

  /**
   * Refresh JWT timer for backend.
   */
  refreshTimer?: any;
}
  