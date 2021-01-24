
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Application specific imports.
import { Column } from "./column.model";

/**
 * Table class containing meta information about
 * a single table in a single database.
 */
export class Table {

  /**
   * Name of table.
   */
  name: string;

  /**
   * Columns in table.
   */
  columns: Column[];
}
