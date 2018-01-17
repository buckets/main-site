CREATE TABLE bank_macro (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uuid TEXT,
    name TEXT,
    enc_recording TEXT,
    enabled TINYINT default 1
);

CREATE UNIQUE INDEX account_mapping_hash ON account_mapping(account_hash);
