-- Up

CREATE TABLE bank_recording (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uuid TEXT,
    name TEXT,
    enc_recording TEXT
);

CREATE UNIQUE INDEX account_mapping_hash ON account_mapping(account_hash);

-- Down
