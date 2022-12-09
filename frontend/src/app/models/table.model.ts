
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Application specific imports.
import { Column } from "./column.model";
import { ForeignKey } from "./foreign-key.model";

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

  /**
   * Foreign keys for table.
   */
  foreign_keys: ForeignKey[];
}
