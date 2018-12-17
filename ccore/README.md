# Building the bucketslib NodeJS package

Go into `bucketslib/` and run:

    make clean && make && make test


# Updating SQLite

1. Download the amalgamation here: <https://sqlite.org/download.html>
2. Put `sqlite3.c` and `sqlite3.h` from the amalgamation into `src/buckets/sqlite3/`