
/*
 * Selects all tables in your magic database.
 *
 * Exchange "magic" below to select tables from a different database.
 */
select table_name from magic.INFORMATION_SCHEMA.TABLES where table_type = 'BASE TABLE'
