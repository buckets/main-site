-- Drop them all

DROP TRIGGER update_account_balance_insert;
DROP TRIGGER update_account_balance_delete;
DROP TRIGGER update_account_balance_update;
DROP TRIGGER update_bucket_balance_insert;
DROP TRIGGER update_bucket_balance_delete;
DROP TRIGGER update_bucket_balance_update;

-- Recreate the triggers with coalescing in place

CREATE TRIGGER update_account_balance_insert
    AFTER INSERT ON account_transaction
    WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
    BEGIN
        UPDATE account SET balance = coalesce(balance,0) + coalesce(new.amount,0) WHERE id = new.account_id;
    END;
CREATE TRIGGER update_account_balance_delete
    AFTER DELETE ON account_transaction
    WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
    BEGIN
        UPDATE account SET balance = coalesce(balance,0) - coalesce(old.amount,0) WHERE id = old.account_id;
    END;
CREATE TRIGGER update_account_balance_update
    AFTER UPDATE ON account_transaction
    WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
    BEGIN
        UPDATE account SET balance = coalesce(balance,0) - coalesce(old.amount,0) WHERE id = old.account_id;
        UPDATE account SET balance = coalesce(balance,0) + coalesce(new.amount,0) WHERE id = new.account_id;
    END;


CREATE TRIGGER update_bucket_balance_insert
    AFTER INSERT ON bucket_transaction
    WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
    BEGIN
        UPDATE bucket SET balance = coalesce(balance,0) + coalesce(new.amount,0) WHERE id = new.bucket_id;
    END;
CREATE TRIGGER update_bucket_balance_delete
    AFTER DELETE ON bucket_transaction
    WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
    BEGIN
        UPDATE bucket SET balance = coalesce(balance,0) - coalesce(old.amount,0) WHERE id = old.bucket_id;
    END;
CREATE TRIGGER update_bucket_balance_update
    AFTER UPDATE ON bucket_transaction
    WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
    BEGIN
        UPDATE bucket SET balance = coalesce(balance,0) - coalesce(old.amount,0) WHERE id = old.bucket_id;
        UPDATE bucket SET balance = coalesce(balance,0) + coalesce(new.amount,0) WHERE id = new.bucket_id;
    END;

UPDATE account_transaction SET amount=0 WHERE amount IS NULL;
UPDATE bucket_transaction SET amount=0 WHERE amount IS NULL;

-- fix broken balances
UPDATE account
SET balance = COALESCE((SELECT SUM(COALESCE(amount, 0))
               FROM account_transaction
               WHERE account_id = account.id), 0)
WHERE balance IS NULL;
