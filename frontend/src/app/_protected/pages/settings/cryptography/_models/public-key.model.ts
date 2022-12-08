
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

/**
 * Model for a public cryptography key.
 */
export class PublicKey {

  /**
   * Unique ID of key.
   */
  id?: number;

  /**
   * Content of public key.
   */
  content: string;

  /**
   * Domain that public key is associated with.
   */
  domain: string;

  /**
   * Email address key is associated with.
   */
  email: string;

  /**
   * Subject for key, typically full name of owner.
   */
  subject: string;

  /**
   * Optional username to associate key with.
   */
  username?: string;

  /**
   * Whether or not key is enabled for cryptography operations or not.
   */
  enabled: boolean;

  /**
   * Fingerprint of key.
   */
  fingerprint: string;

  /**
   * Date and time for when key was imported.
   */
  imported?: Date;

  /**
   * Type of key.
   */
  type: string;

  /**
   * Vocabulary key is allowed to execute on server.
   * 
   * These are the slots the key is allowed to invoke if owner sends Hyperlambda to the server.
   */
  vocabulary: string;
}
