
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
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
