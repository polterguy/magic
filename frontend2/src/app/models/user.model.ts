
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * User model for retrieving users from your backend.
 */
export class User {

  /**
   * Username of user.
   */
  username: string;

  /**
   * Roles user belongs to.
   */
  roles?: string[];
}
  