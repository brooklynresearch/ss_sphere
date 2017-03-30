DO
$do$
BEGIN
FOR i IN 1..50 LOOP
  INSERT INTO prizes (position, wave) VALUES (i, 1);
END LOOP;
END
$do$;

DO
$do$
BEGIN
FOR i IN 1..50 LOOP
  INSERT INTO prizes (position, wave) VALUES (i, 2);
END LOOP;
END
$do$;