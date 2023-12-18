
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Application specific imports.
import { Table } from "./table.model";

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
