
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Application specific imports.
import { Verb } from "./verb.model";
import { ColumnEx } from "./column-ex.model";

/**
 * Table class containing meta information about
 * a single table in a single database.
 */
export class TableEx {

  /**
   * Name of table.
   */
  name: string;

  /**
   * Name of module to generate.
   */
  moduleName?: string;

  /**
   * Name of module to generate.
   */
  moduleUrl?: string;

  /**
   * Number of seconds to cache results of
   * read and count endpoint.
   */
  cache?: number;

  /**
   * Whether or not cache should be public or not, implying
   * proxies can cache result.
   */
  publicCache?: boolean;

  /**
   * Columns in table.
   */
  columns: ColumnEx[];

  /**
   * HTTP verbs to generate for table.
   */
  verbs: Verb[];

  /**
   * Whether or not delete invocations should be logged.
   */
  logDelete: boolean;

  /**
   * Whether or not put invocations should be logged.
   */
  logPut: boolean;

  /**
   * Authentication requirements for invoking POST endpoint.
   */
  authPost: string;

  /**
   * Authentication requirements for invoking GET endpoint.
   */
  authGet: string;

  /**
   * Authentication requirements for invoking PUT endpoint.
   */
  authPut: string;

  /**
   * Authentication requirements for invoking DELETE endpoint.
   */
  authDelete: string;
}
