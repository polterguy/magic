
/*
 * Selects the top 10 tables from your current database having the most records.
 */
select top 10 o.Name, sum(p.rows) as count from sys.objects o
  inner join sys.partitions p ON o.object_id = p.object_id
    where o.type = 'U'
  group by o.Name
  order by sum(p.rows) desc
