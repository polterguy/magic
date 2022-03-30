
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
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
