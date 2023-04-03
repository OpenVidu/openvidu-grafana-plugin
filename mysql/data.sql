DELIMITER //

CREATE PROCEDURE generate_full_day_metrics()
BEGIN
    DECLARE start_date DATETIME;
    DECLARE counter INT DEFAULT 1;
    SET start_date = CONCAT(CURDATE(), ' ', TIME(NOW()));

    WHILE counter <= 500 DO
        INSERT INTO metrics (time, value)
        VALUES (DATE_SUB(start_date, INTERVAL 5*(counter-1) MINUTE), RAND()*100);
        SET counter = counter + 1;
    END WHILE;
END //

DELIMITER ;

CREATE TABLE metrics (
  time DATETIME NOT NULL,
  value FLOAT PRIMARY KEY
);

CALL generate_full_day_metrics();


