
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Column class containing meta information about
 * a single column in a single table.
 */
export class ColumnEx {

  /**
   * Name of column.
   */
  name: string;

  /**
   * Whether or not column is expanded or not (viewing details).
   */
  expanded: boolean;

  /**
   * Whether or not column should be included in HTTP POST invocations or not.
   */
  post: boolean;

  /**
   * Whether or not column should be included in HTTP GET invocations or not.
   */
  get: boolean;

  /**
   * Whether or not column should be included in HTTP PUT invocations or not.
   */
  put: boolean;

  /**
   * Whether or not column should be included in HTTP DELETE invocations or not.
   */
  delete: boolean;
}
