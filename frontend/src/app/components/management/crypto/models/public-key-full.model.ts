
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
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
  