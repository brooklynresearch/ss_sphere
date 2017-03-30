DROP TABLE tablets;
DROP TABLE positions;

CREATE TABLE positions (
  id serial PRIMARY KEY,
  wallNumber int UNIQUE,
  activated boolean,
  prizeImage text,
  prizeText text
);

CREATE TABLE tablets (
  id serial PRIMARY KEY,
  ipAddress text,
  tabletWallNumber int REFERENCES positions(wallNumber)
);
