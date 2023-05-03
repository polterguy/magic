
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

/**
 * Model for cryptographically signed invocations towards your backend.
 */
export class CryptoInvocation {

  /**
   * Unique ID of invocation.
   */
  id: number;

  /**
   * What key was used to cryptographically sign the invocation.
   */
  crypto_key: number;

  /**
   * Date and time of invocation.
   */
  created: Date;

  /**
   * Hyperlambda content of request.
   */
  request: string;

  /**
   * Raw request, including signature of request
   */
  request_raw: Date;

  /**
   * Response server generated and returned to caller.
   */
  response: Date;
}
