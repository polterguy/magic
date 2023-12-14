
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
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

  /**
   * If true, this needs to use an autocomplete and not a select list.
   */
  long?: boolean;
}
