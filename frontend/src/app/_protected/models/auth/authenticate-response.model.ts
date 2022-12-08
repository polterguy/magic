
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
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
