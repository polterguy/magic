
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
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

   /**
    * If true, the referenced table typically contains more than 50 records,
    * possibly thousands of records.
    */
  long_data: boolean
}
