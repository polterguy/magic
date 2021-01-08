
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

export class Column {

  /**
   * Name of column.
   */
  name: string;
}

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
 * Meta information for a single database.
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
   * List of databases in current database server (connection string).
   */
  databases: Database[];
}
  