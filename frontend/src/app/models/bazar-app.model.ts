
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

/**
 * Meta information for a single Bazar app.
 */
export class BazarApp {

  /**
   * Bazar app's ID.
   */
  id: number;

  /**
   * Name of app.
   */
  name: string;

  /**
   * Description of app.
   */
  description: string;

  /**
   * Price of app, if the app is free this will be 0.
   */
  price: number;

  /**
   * Current version of app.
   */
  version: string;

  /**
   * Minimum Magic version required to install module.
   */
  min_magic_version: string;

  /**
   * Type of app, typically 'module', 'template', etc ...
   */
  type: string;

  /**
   * Name of folder where app should be installed.
   * 
   * Combines with type, this checks to see if we already have an (old?) version installed.
   */
  folder_name: string;

  /**
   * When the app was published.
   */
  created: Date;

  /**
   * If true, app has update in Magic Bazar.
   */
  hasUpdate?: boolean = false;

  /**
   * If app has update this will be the new available version from the Bazar.
   */
  newVersion?: string = null;
}
