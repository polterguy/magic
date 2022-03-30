
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

/**
 * Status of setup process.
 */
export class Status {

  /**
   * Is true if the system has been setup.
   */
  config_done: boolean;

  /**
   * Is true if your magic database has been crudified.
   */
  magic_crudified: boolean;

  /**
   * Is true if the server has a cryptography key pair.
   */
  server_keypair: boolean;
}
  