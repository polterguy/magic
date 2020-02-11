

-- These are sample SQL scripts that you can store, and rapidly reload from your SQL editor
-- They can be found in the '/misc/mysql/templates/' folder in your system

-- Selects top 10 paying customers from Sakila database.
-- Notice, make sure you somehow select the "Sakila" database, using for instance.
-- use Sakila; -- or something similar ...
select concat(c.first_name, ' ', c.last_name) as label, sum(amount) as value
    from payment p
	inner join customer c on p.customer_id = c.customer_id
	group by c.customer_id order by value desc
    limit 10
