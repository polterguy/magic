
/*
 * Selects the top 10 tables from your current database having the most records.
 */
select top 10 o.name, sum(p.rows) as count from sys.objects o
  inner join sys.partitions p ON o.object_id = p.object_id
    where o.type = 'U'
  group by o.name
  order by sum(p.rows) desc
