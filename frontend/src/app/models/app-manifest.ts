
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
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
   * Friendly name of app.
   */
  name: string;

  /**
   * Version of installed app.
   */
  version: string;

  /**
   * Download token, required to update app when updates are available.
   */
  token: string;

  /**
   * If this is true, there exists an update for app in the Bazar.
   */
  has_update?: boolean = false;

  /**
   * If app has an update, this will be its new version.
   */
  new_version?: string;
}
