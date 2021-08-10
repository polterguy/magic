
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Lookup model describing lookup for a single field.
 */
export class Lookup {

  /**
   * Key/value in other table to associate with field.
   */
  key: string;

  /**
   * Field to display to end user as he selects a value.
   */
  name: string;

  /**
   * Name of table we're doing a lookup into.
   */
  table: string;
}

/**
 * Argument model describing a single argument to an endpoint.
 */
export class Argument {

  /**
   * The name of the argument.
   */
  name: string;

  /**
   * The Hyperlambda type of the argument.
   */
  type: string;

  /**
   * If table is a foreign key into another table, this will contain that data.
   */
  lookup: Lookup;
}
