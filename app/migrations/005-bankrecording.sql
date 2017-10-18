-- Up

CREATE TABLE bank_recording (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uuid TEXT,
    name TEXT,
    enc_recording TEXT,
    enc_values TEXT
);

-- Down
