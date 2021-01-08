
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Column class containing meta information about
 * a single column in a single table.
 */
export class Column {

  /**
   * Name of column.
   */
  name: string;
}

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

/**
 * Database meta information type, describing all databases in
 * a single database server, name of databases,
 * tables, and columns information etc.
 */
export class Databases {

  /**
   * List of all databases in a single database server.
   */
  databases: Database[];
}
  