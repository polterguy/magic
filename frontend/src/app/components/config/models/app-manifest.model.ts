
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Manifest for a single app from the Bazar.
 */
export class AppManifest {

  /**
   * Name of app.
   */
   name: string;
  
  /**
   * Name of module as it should be installed into backend,
   * as in its root folder within the modules folder.
   */
   module_name: string;
  
  /**
   * Small descriptive text explaining the module.
   */
   description: string;
  
  /**
   * Version of module that can be installed.
   */
   version: string;
  
  /**
   * URL to zip file containing module.
   */
   url: string;
  
  /**
   * Version of Magic backend module requires.
   */
   requires: string;
  
  /**
   * What databases module supports.
   */
   database_support: string[];
  }
