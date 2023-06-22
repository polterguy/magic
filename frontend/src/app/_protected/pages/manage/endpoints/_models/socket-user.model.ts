
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

/**
 * Model describing a single socket connected users, and his current connections.
 */
export class SocketUser {

  /**
   * The username that is currently connected.
   */
  username: string;

  /**
   * List of connections user currently has.
   */
  connections: string[];
}
