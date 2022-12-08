
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

/**
 * Wrapper class for purchasing an app.
 */
export class BazarAppWrapper {
  app: BazarApp;
  purchase: (app: BazarApp, after: () => void) => void;
}

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
}
