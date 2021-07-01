
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
    * Git repository's URL.
    */
   git: string;

   /**
    * Type of module.
    * 
    * Notice, we only support 'module' for now, but we might support
    * alternative types in the future, such as 'frontend-template', etc.
    */
   type: string;
  
  /**
   * Version of module that can be installed.
   */
   version: string;
  
  /**
   * URL to zip file containing module.
   */
   url: string;
  
  /**
   * URL to README.md file.
   */
   readme: string;
  
  /**
   * Version of Magic backend module requires.
   */
   requires: string;
  
  /**
   * What databases module supports.
   */
   database_support: string[];

   /**
    * Email address, and/or name of publisher.
    */
   publisher: string;
  }
