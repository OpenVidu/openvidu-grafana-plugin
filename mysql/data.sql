DELIMITER //

CREATE PROCEDURE generate_full_day_metrics()
BEGIN
    DECLARE video_value INT DEFAULT 0;
    DECLARE start_date DATETIME;
    DECLARE counter INT DEFAULT 1;
    SET start_date = CONCAT(CURDATE(), ' ', TIME(NOW()));

    WHILE counter <= 600 DO
        INSERT INTO metrics (time, value)
        VALUES (DATE_SUB(start_date, INTERVAL 10*(counter-1) SECOND), RAND()*100);

        INSERT INTO video_metadata (time, value)
        VALUES (DATE_SUB(start_date, INTERVAL 10*(counter-1) SECOND), video_value);

        SET counter = counter + 1;
        SET video_value = video_value +1;

    END WHILE;

END //

DELIMITER ;

CREATE TABLE metrics (
  time DATETIME NOT NULL PRIMARY KEY,
  value FLOAT
);


CREATE TABLE video_metadata (
  time DATETIME NOT NULL PRIMARY KEY,
  value INT
);

CALL generate_full_day_metrics();


