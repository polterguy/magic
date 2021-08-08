/*
 * Counts number of movies each actor has participated in
 */
select concat(a.first_name, ' ', a.last_name) as name, count(*) as value
  from actor a
  inner join film_actor fa on fa.actor_id = a.actor_id
  group by a.actor_id
  order by value desc
  limit 25
