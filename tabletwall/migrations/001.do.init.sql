CREATE TABLE tablets (
  id int PRIMARY KEY,
  wallNumber int UNIQUE,
  activated boolean,
  prizeImage text,
  prizeText text
);

CREATE TABLE ipAddresses (
  id int PRIMARY KEY,
  address text,
  tabletWallNumber int REFERENCES tablets(wallNumber)
);
