-- Up

CREATE TABLE bank_recording (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name TEXT,
    recording TEXT,
    enc_credentials TEXT
);

-- Down
