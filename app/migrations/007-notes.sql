-- Up

ALTER TABLE account ADD COLUMN notes TEXT DEFAULT '';
UPDATE account SET notes = '';
ALTER TABLE account_transaction ADD COLUMN notes TEXT DEFAULT '';
UPDATE account_transaction SET notes = '';
ALTER TABLE bucket_transaction ADD COLUMN notes TEXT DEFAULT '';
UPDATE bucket_transaction SET notes = '';
ALTER TABLE bucket_group ADD COLUMN notes TEXT DEFAULT '';
UPDATE bucket_group SET notes = '';

-- Down
