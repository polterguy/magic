
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
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
   * Password of user.
   */
  password?: string;

  /**
   * Whether or not user has been locked out from site or not.
   */
  locked?: boolean;

  /**
   * Roles user belongs to.
   */
  roles?: string[];
}
  