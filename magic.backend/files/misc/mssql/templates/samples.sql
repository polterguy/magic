

-- These are sample SQL scripts that you can store, and rapidly reload from your SQL editor
-- They can be found in the '/misc/mssql/templates/' folder in your system

-- Selects all records from some table

use some_database;
select * from some_table;

-- Selects top 15 average UnitPrice from Northwind

select top 15 ProductName as label, avg(UnitPrice) as value
	from Products
    group by ProductName
    order by value desc
