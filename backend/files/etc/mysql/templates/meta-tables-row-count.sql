
/*
 * Counts number of record in your MNagic database.
 *
 * Change table_schema to some other database, to count records
 * in other databases.
 */
select table_name, table_rows
  from `information_schema`.`tables`
  where `table_schema` = 'magic';
