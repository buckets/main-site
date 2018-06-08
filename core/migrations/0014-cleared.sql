ALTER TABLE account_transaction ADD COLUMN cleared TINYINT DEFAULT 0;
UPDATE account_transaction SET cleared = 1;
