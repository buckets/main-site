-- Up

CREATE TABLE account (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name TEXT,
    balance INTEGER,
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
    description TEXT,
    balance INTEGER DEFAULT 0,
    out_to_pasture TINYINT DEFAULT 0,
    group_id INTEGER,
    ranking TEXT,
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
    account_transaction_id INTEGER,
    FOREIGN KEY(bucket_id) REFERENCES bucket(id)
);
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

-- Down
