/**
 * Authentication token, returned from backend as user authenticates.
 * Contains a JWT token in its ticket field.
 */
export class AuthenticateToken {

  /**
   * Actual JWT token returned from backend.
   */
  ticket: string;
}
