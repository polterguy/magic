
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Application specific imports.
import { Table } from "../../../../models/table.model";

/**
 * Database class containing meta information about
 * a single database in a single database server instance.
 */
export class Database {

  /**
   * Name of database.
   */
  name: string;

  /**
   * List of all tables in database.
   */
  tables: Table[];
}
