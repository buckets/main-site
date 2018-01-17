-- -----------------------------------------------------
-- Accounts
-- -----------------------------------------------------
CREATE TABLE account (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name TEXT DEFAULT '',
    balance INTEGER DEFAULT 0,
    currency TEXT
);

CREATE TABLE account_transaction (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    account_id INTEGER,
    amount INTEGER,
    memo TEXT,
    fi_id TEXT,
    general_cat TEXT DEFAULT '',
    FOREIGN KEY(account_id) REFERENCES account(id)
);

CREATE INDEX account_transaction_posted
    ON account_transaction(posted);
CREATE INDEX account_transaction_fi_id
    ON account_transaction(fi_id);

CREATE TRIGGER update_account_balance_insert
    AFTER INSERT ON account_transaction
    BEGIN
        UPDATE account SET balance = balance + new.amount WHERE id = new.account_id;
    END;
CREATE TRIGGER update_account_balance_delete
    AFTER DELETE ON account_transaction
    BEGIN
        UPDATE account SET balance = balance - old.amount WHERE id = old.account_id;
    END;
CREATE TRIGGER update_account_balance_update
    AFTER UPDATE ON account_transaction
    BEGIN
        UPDATE account SET balance = balance - old.amount WHERE id = old.account_id;
        UPDATE account SET balance = balance + new.amount WHERE id = new.account_id;
    END;

-- -----------------------------------------------------
-- Buckets
-- -----------------------------------------------------
CREATE TABLE bucket_group (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name TEXT,
    ranking TEXT
);

CREATE TABLE bucket (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name TEXT,
    notes TEXT DEFAULT '',
    balance INTEGER DEFAULT 0,
    kicked TINYINT DEFAULT 0,
    group_id INTEGER default NULL,
    ranking TEXT default '',
    kind TEXT default '',
    goal INTEGER,
    end_date DATE,
    deposit INTEGER,
    color TEXT,
    FOREIGN KEY(group_id) REFERENCES bucket_group(id)
);

CREATE TABLE bucket_transaction (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bucket_id INTEGER,
    amount INTEGER,
    memo TEXT,
    account_trans_id INTEGER,
    transfer TINYINT DEFAULT 0,
    FOREIGN KEY(bucket_id) REFERENCES bucket(id)
);

CREATE INDEX bucket_transaction_posted
    ON bucket_transaction(posted);
CREATE INDEX bucket_transaction_account_trans_id
    ON bucket_transaction(account_trans_id);

CREATE TRIGGER update_bucket_balance_insert
    AFTER INSERT ON bucket_transaction
    BEGIN
        UPDATE bucket SET balance = balance + new.amount WHERE id = new.bucket_id;
    END;
CREATE TRIGGER update_bucket_balance_delete
    AFTER DELETE ON bucket_transaction
    BEGIN
        UPDATE bucket SET balance = balance - old.amount WHERE id = old.bucket_id;
    END;
CREATE TRIGGER update_bucket_balance_update
    AFTER UPDATE ON bucket_transaction
    BEGIN
        UPDATE bucket SET balance = balance - old.amount WHERE id = old.bucket_id;
        UPDATE bucket SET balance = balance + new.amount WHERE id = new.bucket_id;
    END;

-- -----------------------------------------------------
-- Misc
-- -----------------------------------------------------
CREATE TABLE simplefin_connection (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_token TEXT,
    last_used TIMESTAMP
);
CREATE TABLE account_mapping (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    account_id INTEGER,
    account_hash TEXT,
    FOREIGN KEY(account_id) REFERENCES account(id)
);
CREATE TABLE unknown_account (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    account_hash TEXT
);
CREATE UNIQUE INDEX unknown_account_hash ON unknown_account(account_hash);
