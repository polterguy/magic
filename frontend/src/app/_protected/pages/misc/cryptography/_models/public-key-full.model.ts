
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

/**
 * Model for a public cryptography key, with all fields.
 */
export class PublicKeyFull {

  /**
   * Fingerprint of key.
   */
  fingerprint: string;

  /**
   * What format fingerprint is in.
   */
  fingerprintFormat: string;

  /**
   * Format key is encoded in.
   */
  keyFormat: string;

  /**
   * Type of cryptography key.
   */
  keyType: string;

  /**
   * Content of public key.
   */
  publicKey: string;
}
