
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Foreign key model, encapsulating a single foreign key.
 */
export class ForeignKey {

  /**
   * Name of column that has the foreign key.
   */
   column?: string;

   /**
    * Name of table foreign key points to.
    */
   foreign_table: string;

   /**
    * Name of field in foreign key table.
    */
   foreign_column: string;

   /**
    * Display name.
    */
   foreign_name?: string;
}
