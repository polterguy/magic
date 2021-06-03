
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
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
