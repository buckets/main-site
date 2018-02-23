-- Drop them all

DROP TRIGGER update_account_balance_insert;
DROP TRIGGER update_account_balance_delete;
DROP TRIGGER update_account_balance_update;
DROP TRIGGER update_bucket_balance_insert;
DROP TRIGGER update_bucket_balance_delete;
DROP TRIGGER update_bucket_balance_update;
DROP TRIGGER account_transaction_delete;

-- Recreate the triggers with new WHEN

CREATE TABLE x_trigger_disabled (
    col TINYINT
);

CREATE TRIGGER update_account_balance_insert
    AFTER INSERT ON account_transaction
    WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
    BEGIN
        UPDATE account SET balance = balance + new.amount WHERE id = new.account_id;
    END;
CREATE TRIGGER update_account_balance_delete
    AFTER DELETE ON account_transaction
    WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
    BEGIN
        UPDATE account SET balance = balance - old.amount WHERE id = old.account_id;
    END;
CREATE TRIGGER update_account_balance_update
    AFTER UPDATE ON account_transaction
    WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
    BEGIN
        UPDATE account SET balance = balance - old.amount WHERE id = old.account_id;
        UPDATE account SET balance = balance + new.amount WHERE id = new.account_id;
    END;


CREATE TRIGGER update_bucket_balance_insert
    AFTER INSERT ON bucket_transaction
    WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
    BEGIN
        UPDATE bucket SET balance = balance + new.amount WHERE id = new.bucket_id;
    END;
CREATE TRIGGER update_bucket_balance_delete
    AFTER DELETE ON bucket_transaction
    WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
    BEGIN
        UPDATE bucket SET balance = balance - old.amount WHERE id = old.bucket_id;
    END;
CREATE TRIGGER update_bucket_balance_update
    AFTER UPDATE ON bucket_transaction
    WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
    BEGIN
        UPDATE bucket SET balance = balance - old.amount WHERE id = old.bucket_id;
        UPDATE bucket SET balance = balance + new.amount WHERE id = new.bucket_id;
    END;


CREATE TRIGGER account_transaction_delete
    AFTER DELETE ON account_transaction
    WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
    BEGIN
        DELETE FROM bucket_transaction WHERE account_trans_id=OLD.id;
    END;
