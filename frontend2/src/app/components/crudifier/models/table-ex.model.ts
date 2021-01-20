
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Application specific imports.
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
   * Columns in table.
   */
  columns: ColumnEx[];
}
