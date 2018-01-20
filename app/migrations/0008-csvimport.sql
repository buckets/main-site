CREATE TABLE csv_import_mapping (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fingerprint_hash TEXT,
    mapping_json TEXT
);
