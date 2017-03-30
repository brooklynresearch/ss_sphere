CREATE TABLE prizes (
  id serial PRIMARY KEY,
  name text,
  position int REFERENCES positions(wallnumber),
  wave int,
  won_at timestamp
)
