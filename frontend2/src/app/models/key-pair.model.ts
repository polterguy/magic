
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Key pair model for cryptography key pairs.
 */
export class KeyPair {
  fingerprint: string;
  public_key: string;
  private_key?: string;
}
  