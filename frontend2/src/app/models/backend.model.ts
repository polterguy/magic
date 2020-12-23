
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
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
  