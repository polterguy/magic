

-- These are sample SQL scripts that you can store, and rapidly reload from your SQL editor
-- They can be found in the '/misc/mssql/templates/' folder in your system

-- Selects top 15 average UnitPrice from Northwind
-- Notice, make sure you somehow select the "Northwind" database, using for instance.
-- use Northwind; -- or something similar ...
select top 15 ProductName as label, avg(UnitPrice) as value
	from Products
    group by ProductName
    order by value desc
