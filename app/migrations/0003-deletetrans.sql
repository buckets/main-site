CREATE TRIGGER account_transaction_delete
    AFTER DELETE ON account_transaction
    BEGIN
        DELETE FROM bucket_transaction WHERE account_trans_id=OLD.id;
    END;

-- clean up the old ones
DELETE FROM bucket_transaction
    WHERE
        account_trans_id IS NOT NULL
        AND account_trans_id NOT IN (SELECT id FROM account_transaction);
