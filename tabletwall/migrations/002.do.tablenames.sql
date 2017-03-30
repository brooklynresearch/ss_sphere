CREATE TABLE positions (
  id int PRIMARY KEY,
  wallNumber int UNIQUE,
  activated boolean,
  prizeImage text,
  prizeText text
);

CREATE TABLE tablets (
  id int PRIMARY KEY,
  ipAddress text,
  tabletWallNumber int REFERENCES positions(wallNumber)
);
