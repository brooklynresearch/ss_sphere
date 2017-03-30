DROP TABLE tablets;
DROP TABLE positions;

CREATE TABLE positions (
  wallNumber serial PRIMARY KEY,
  activated boolean,
  prizeImage text,
  prizeText text
);

CREATE TABLE tablets (
  id serial PRIMARY KEY,
  ipAddress text UNIQUE,
  tabletWallNumber int REFERENCES positions(wallNumber)
);

DO
$do$
BEGIN
FOR i IN 1..50 LOOP
  INSERT INTO positions (activated) VALUES (false);
END LOOP;
END
$do$;
