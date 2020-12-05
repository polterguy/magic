
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Model returned from backend as user checks the status of his backend.
 */
export class Status {

  /**
   * Is true if your magic database has been crudified.
   */
  magic_crudified: boolean;

  /**
   * Is true if the server has a cryptography key pair.
   */
  server_keypair: boolean;

  /**
   * Is true if the system has been setup.
   */
  setup_done: boolean;
}
  