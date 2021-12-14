select
  c.column_name, c.is_nullable, c.data_type, c.column_default, exists(
    select *
      from information_schema.key_column_usage kcu  
      join information_schema.table_constraints tc on tc.constraint_name = kcu.constraint_name 
      where 
        tc.constraint_type = 'PRIMARY KEY' and
        kcu.table_name = 'film_category' and 
        c.column_default is not null and
        c.column_name = kcu.column_name and c.table_name = kcu.table_name
  ) as is_pk
  from information_schema.columns c
  where c.table_name = 'film_category'