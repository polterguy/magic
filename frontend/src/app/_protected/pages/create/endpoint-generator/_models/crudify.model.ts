
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

/**
 * Argument type for crudify class.
 */
export class ArgType {

  /**
   * Columns to include.
   */
  columns?: any[];

  /**
   * Primary keys to include.
   */
  primary?: any[];
}

/**
 * Crudify model used as input when user wants to crudify a database table,
 * to create a CRUD endpoint wrapping it.
 */
export class Crudify {

  /**
   * Database type, e.g. 'mysql', 'psql', 'sqlite' or 'mssql'.
   */
  databaseType: string;

  /**
   * Name of module to generate. Becomes the root folder
   * name beneath the modules folder on the server.
   */
  moduleName: string;

  /**
   * Module URL. Becomes the last entity in the URL of
   * the endpoint generated
   */
  moduleUrl: string;

  /**
   * Name of database where table can be found.
   */
  database: string;

  /**
   * Name of database table to crudify.
   */
  table: string;

  /**
   * Whether or not the ID should be returned from generated endpoint
   * as items are created. Only relevant for POST endpoint types.
   */
  returnId?: boolean;

  /**
   * Template filename to use for crudifying process.
   * This is the base template used when creating the endpoint Hyperlambda file.
   */
  template: string;

  /**
   * HTTP verb. POST, PUT, DELETE or GET.
   */
  verb: string;

  /**
   * Comma separated list of roles users must belong to to be able
   * to invoke endpoint.
   */
  auth?: string;

  /**
   * Captcha value requirement to be allowed to invoke endpoint.
   */
  captcha?: number;

  /**
   * Log entry to create when endpoint is invoked.
   */
  log?: string;

  /**
   * Number of seconds to cache GET invocations.
   */
  cache?: number;

  /**
   * Whether or not above cache should be available for proxies or not.
   */
  publicCache?: boolean;

  /**
   * Whether or not the crudify process should overwrite existing
   * endpoints or not. If false, the process will throw an exception
   * instead of overwriting previously generated endpoint files.
   */
  overwrite: boolean;

  /**
   * Whether or not the crudify process should create verbose endpoint, allowing
   * for as many possible query arguments as possible, or only the bare minimum.
   */
  verbose: boolean;

  /**
   * Whether or not the crudify process should implement left joins for all foreign keys.
   */
  join: boolean;

  /**
   * Arguments for endpoint. Basically primary keys and input arguments.
   */
  args: ArgType;

  /**
   * Input reactors such as validators, transformers, injectables, etc.
   */
  validators?: string;

  /**
   * Whether or not to turn on the CQRS pattern when crudifying table.
   */
  cqrs: boolean;

  /**
   * If CQRS is turned on, this declares what type of authorisation requirements
   * the messages will be published with. Legal values are.
   * 
   * - none
   * - inherited
   * - roles
   * 
   * If type is 'roles' the cqrsAuthorisationValues should be a comma separated
   * list of which roles messages are published to.
   */
  cqrsAuthorisation?: string;

  /**
   * Only relevant if above field is 'roles', at which point this should be
   * the comma separated list of which roles messages are published to.
   */
  cqrsAuthorisationValues?: string;
}
