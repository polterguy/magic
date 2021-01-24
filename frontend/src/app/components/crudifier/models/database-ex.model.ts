
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Application specific imports.
import { TableEx } from "./table-ex.model";

/**
 * Crudify database class containing meta information about
 * a single database in a single database server instance, and its
 * crudification options.
 */
export class DatabaseEx {

  /**
   * Name of database.
   */
  name: string;

  /**
   * List of all tables in database.
   */
  tables: TableEx[];
}
