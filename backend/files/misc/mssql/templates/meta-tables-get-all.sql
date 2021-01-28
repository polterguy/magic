
/*
 * Selects all tables in your magic database.
 *
 * Exchange "magic" below to select tables from a different database.
 */
select table_name from magic.information_schema.tables where table_type = 'base table'
