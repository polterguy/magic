
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Manifest meta data for an already installed app.
 */
export class AppManifest {

  /**
   * When the app was installed.
   */
  installed: Date;

  /**
   * Username of user that installed the app.
   */
  installed_by: string;

  /**
   * Folder/module name of app.
   */
  module_name: string;

  /**
   * Version of installed app.
   */
  version: string
}
