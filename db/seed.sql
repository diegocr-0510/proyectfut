INSERT INTO venues (name, address, map_query, is_approved)
SELECT data.name, data.address, data.map_query, TRUE
FROM (VALUES
  ('Cancha La Hacienda', 'Barrio San Martín, Ciudad Quesada', 'Cancha La Hacienda Ciudad Quesada Costa Rica'),
  ('Futbol City Quesada', 'San Rafael, Ciudad Quesada', 'Futbol City Quesada San Carlos Costa Rica'),
  ('Complejo Deportivo Norte', 'Quesada centro, San Carlos', 'Complejo Deportivo Norte Ciudad Quesada Costa Rica')
) AS data(name, address, map_query)
WHERE NOT EXISTS (SELECT 1 FROM venues v WHERE v.name = data.name);

INSERT INTO pitches (venue_id, name, price_per_hour, active)
SELECT v.id, v.name, data.price, TRUE
FROM venues v
JOIN (VALUES
  ('Cancha La Hacienda', 18000.00),
  ('Futbol City Quesada', 20000.00),
  ('Complejo Deportivo Norte', 16000.00)
) AS data(name, price) ON data.name = v.name
WHERE NOT EXISTS (SELECT 1 FROM pitches p WHERE p.venue_id = v.id);
