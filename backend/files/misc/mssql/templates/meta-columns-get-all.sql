
/*
 * Selects all tables in your magic database.
 *
 * Exchange "log_entries" below to select tables from a different database.
 */
select c.name
  from sys.tables as t
    inner join sys.columns c on t.object_id = c.object_id
  where t.name = 'log_entries'
