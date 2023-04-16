
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
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
