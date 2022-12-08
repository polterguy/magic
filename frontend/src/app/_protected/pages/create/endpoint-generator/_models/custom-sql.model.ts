
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

/**
 * Model used for crudifying a custom SQL endpoint.
 */
export class CustomSql {

  /**
   * Database type to wrap, e.g. 'mysql', 'pgsql', 'sqlite' or 'mssql'.
   */
  databaseType: string;

  /**
   * Database name endpoint wraps.
   */
  database: string;

  /**
   * Comma separated list of roles users must belong to in
   * order to be allowed to invoke endpoint.
   */
  authorization: string;

  /**
   * Name of module, implying the second last parts of the endpoint's relative URL.
   */
  moduleName: string;

  /**
   * Name of module, implying the very last parts of the endpoint's relative URL.
   */
  endpointName: string;

  /**
   * HTTP verb endpoint wraps, e.g. 'post', 'put', 'get' or 'delete'.
   */
  verb: string;

  /**
   * SQL endpoint should execute when invoked.
   */
  sql: string;

  /**
   * Hyperlambda declaration of arguments endpoint can handle.
   */
  arguments: string;

  /**
   * Whether or not existing endpoints with the same verb/moduleName/endpointName
   * combination should be overwritten or not.
   */
  overwrite: boolean;

  /**
   * Whether or not endpoint should return a list of items,
   * or a single item (scalar value, or a single record).
   */
  isList: boolean;
}
