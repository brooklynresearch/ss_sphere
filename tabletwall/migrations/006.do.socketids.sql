DROP TABLE IF EXISTS tablets;
DROP TABLE IF EXISTS positions;

CREATE TABLE positions (
  wallnumber serial PRIMARY KEY,
  activated boolean,
  prizeimage text,
  prizetext text
);

CREATE TABLE tablets (
  id serial PRIMARY KEY,
  ipaddress text UNIQUE,
  socketid text,
  tabletwallnumber int REFERENCES positions(wallnumber)
);

DO
$do$
BEGIN
FOR i IN 1..50 LOOP
  INSERT INTO positions (activated) VALUES (false);
END LOOP;
END
$do$;
