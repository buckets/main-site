CREATE TABLE settings (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    key TEXT,
    value TEXT
);

CREATE TRIGGER there_can_be_only_one_setting
    BEFORE INSERT ON settings
    BEGIN
        DELETE FROM settings WHERE key=NEW.key;
    END;
